#!/usr/bin/env tsx
/**
 * Auto-Fix Workflow Script
 *
 * Automatically detects and fixes common workflow JSON issues:
 * - AI SDK parameter format (missing options wrapper)
 * - AI SDK output references (missing .content)
 * - zipToObjects string fields (should be arrays)
 * - Array function parameter mismatches
 * - Variable name typos
 * - Module path case sensitivity
 *
 * Usage:
 *   npx tsx scripts/auto-fix-workflow.ts <workflow-file.json>
 *   npx tsx scripts/auto-fix-workflow.ts <workflow-file.json> --write
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { getModuleRegistry } from '../src/lib/workflows/module-registry';

interface WorkflowStep {
  id: string;
  module: string;
  inputs: Record<string, unknown>;
  outputAs?: string;
}

interface Workflow {
  version: string;
  name: string;
  description: string;
  trigger?: {
    type: string;
    config?: Record<string, unknown>;
  };
  config: {
    steps: WorkflowStep[];
    outputDisplay?: Record<string, unknown>;
  };
  metadata?: {
    requiresCredentials?: string[];
  };
}

interface Fix {
  stepId: string;
  type: string;
  before: string;
  after: string;
  description: string;
}

const fixes: Fix[] = [];

// Patterns for AI SDK modules
const AI_SDK_MODULES = [
  'ai.ai-sdk.generateText',
  'ai.ai-sdk.chat',
  'ai.ai-sdk.streamText',
  'ai.ai-sdk.generateJSON',
];

// Array functions that use rest parameters
const REST_PARAM_ARRAY_FUNCTIONS = [
  'utilities.array-utils.intersection',
  'utilities.array-utils.union',
  'utilities.array-utils.zip',
];

// Array functions that use separate arr1, arr2 params
const SEPARATE_ARRAY_FUNCTIONS = [
  'utilities.array-utils.difference',
];

/**
 * Fix 1: AI SDK modules missing options wrapper
 */
function fixAISDKParameterFormat(workflow: Workflow): void {
  for (const step of workflow.config.steps) {
    if (AI_SDK_MODULES.includes(step.module)) {
      if (!step.inputs.options && (step.inputs.prompt || step.inputs.messages)) {
        const before = JSON.stringify(step.inputs);
        step.inputs = { options: step.inputs };
        const after = JSON.stringify(step.inputs);

        fixes.push({
          stepId: step.id,
          type: 'AI_SDK_OPTIONS_WRAPPER',
          before,
          after,
          description: `Wrapped AI SDK inputs in "options" object`,
        });
      }
    }
  }
}

/**
 * Fix 2: AI SDK minimum token requirement (OpenAI requires >= 16 tokens)
 */
function fixAISDKMinTokens(workflow: Workflow): void {
  const MIN_TOKENS = 16;

  for (const step of workflow.config.steps) {
    if (AI_SDK_MODULES.includes(step.module)) {
      const options = step.inputs.options as Record<string, unknown> | undefined;
      if (options && typeof options.maxTokens === 'number' && options.maxTokens < MIN_TOKENS) {
        const oldTokens = options.maxTokens;
        const before = JSON.stringify(step.inputs);
        options.maxTokens = 20; // Set to 20 to be safe above minimum
        const after = JSON.stringify(step.inputs);

        fixes.push({
          stepId: step.id,
          type: 'AI_SDK_MIN_TOKENS',
          before,
          after,
          description: `Increased maxTokens from ${oldTokens} to 20 (OpenAI minimum is ${MIN_TOKENS})`,
        });
      }
    }
  }
}

/**
 * Fix 3: AI SDK outputs used without .content
 */
function fixAISDKContentReferences(workflow: Workflow): void {
  // Find all AI SDK output variables
  const aiOutputVars = new Set<string>();
  for (const step of workflow.config.steps) {
    if (AI_SDK_MODULES.includes(step.module) && step.outputAs) {
      aiOutputVars.add(step.outputAs);
    }
  }

  // Check all steps for references to AI outputs
  for (const step of workflow.config.steps) {
    // String utility functions that need .content
    const needsContent = step.module.startsWith('utilities.string-utils.');

    if (needsContent) {
      const inputsStr = JSON.stringify(step.inputs);
      let modified = false;
      let newInputsStr = inputsStr;

      for (const aiVar of aiOutputVars) {
        const regex = new RegExp(`{{${aiVar}}}(?!\\.)`, 'g');
        if (regex.test(inputsStr)) {
          newInputsStr = newInputsStr.replace(
            new RegExp(`{{${aiVar}}}`, 'g'),
            `{{${aiVar}.content}}`
          );
          modified = true;
        }
      }

      if (modified) {
        step.inputs = JSON.parse(newInputsStr);
        fixes.push({
          stepId: step.id,
          type: 'AI_SDK_CONTENT_ACCESS',
          before: inputsStr,
          after: newInputsStr,
          description: `Added .content to AI SDK variable references`,
        });
      }
    }
  }
}

/**
 * Fix 3: zipToObjects with string fields instead of arrays
 */
function fixZipToObjectsArrays(workflow: Workflow): void {
  for (const step of workflow.config.steps) {
    if (step.module === 'utilities.array-utils.zipToObjects') {
      const fieldArrays = step.inputs.fieldArrays as Record<string, unknown>;
      if (!fieldArrays) continue;

      // Find the length from the first array field
      let targetLength = 0;
      for (const value of Object.values(fieldArrays)) {
        if (Array.isArray(value)) {
          targetLength = value.length;
          break;
        }
      }

      if (targetLength === 0) continue;

      for (const [field, value] of Object.entries(fieldArrays)) {
        if (typeof value === 'string') {
          const before = JSON.stringify({ [field]: value });
          // Convert string to array by repeating it
          fieldArrays[field] = Array(targetLength).fill(value);
          const after = JSON.stringify({ [field]: fieldArrays[field] });

          fixes.push({
            stepId: step.id,
            type: 'ZIPTOOBJECTS_STRING_TO_ARRAY',
            before,
            after,
            description: `Converted string field "${field}" to array of length ${targetLength}`,
          });
        }
      }
    }
  }
}

/**
 * Fix 4: Array function parameter format mismatches
 */
function fixArrayFunctionParameters(workflow: Workflow): void {
  for (const step of workflow.config.steps) {
    // Fix rest parameter functions (intersection, union, zip)
    if (REST_PARAM_ARRAY_FUNCTIONS.includes(step.module)) {
      // Check if using wrong format (arr1, arr2 instead of arrays)
      if ((step.inputs.arr1 || step.inputs.array1) && (step.inputs.arr2 || step.inputs.array2) && !step.inputs.arrays) {
        const before = JSON.stringify(step.inputs);
        const arr1 = step.inputs.arr1 || step.inputs.array1;
        const arr2 = step.inputs.arr2 || step.inputs.array2;
        const arrays = [arr1, arr2];

        // Clean up old properties
        delete step.inputs.arr1;
        delete step.inputs.arr2;
        delete step.inputs.array1;
        delete step.inputs.array2;

        step.inputs.arrays = arrays;
        const after = JSON.stringify(step.inputs);

        fixes.push({
          stepId: step.id,
          type: 'ARRAY_FUNCTION_REST_PARAMS',
          before,
          after,
          description: `Converted arr1/arr2 to arrays parameter for ${step.module}`,
        });
      }
    }

    // Fix separate parameter functions (difference)
    if (SEPARATE_ARRAY_FUNCTIONS.includes(step.module)) {
      // Check if using wrong format (arrays instead of arr1, arr2)
      if (step.inputs.arrays && !step.inputs.arr1) {
        const arrays = step.inputs.arrays as unknown[];
        if (Array.isArray(arrays) && arrays.length >= 2) {
          const before = JSON.stringify(step.inputs);
          step.inputs.arr1 = arrays[0];
          step.inputs.arr2 = arrays[1];
          delete step.inputs.arrays;
          const after = JSON.stringify(step.inputs);

          fixes.push({
            stepId: step.id,
            type: 'ARRAY_FUNCTION_SEPARATE_PARAMS',
            before,
            after,
            description: `Converted arrays to arr1/arr2 parameters for ${step.module}`,
          });
        }
      }
    }
  }
}

/**
 * Fix 5: Variable name typos (spaces, case mismatches)
 */
function fixVariableNameTypos(workflow: Workflow): void {
  // Collect all outputAs names
  const declaredVars = new Map<string, string>();
  for (const step of workflow.config.steps) {
    if (step.outputAs) {
      declaredVars.set(step.outputAs.toLowerCase().replace(/\s+/g, ''), step.outputAs);
    }
  }

  // Check all variable references
  for (const step of workflow.config.steps) {
    const inputsStr = JSON.stringify(step.inputs);
    const varMatches = inputsStr.matchAll(/{{([^}]+)}}/g);

    for (const match of varMatches) {
      const varRef = match[1];
      // Skip trigger variables
      if (varRef.startsWith('trigger.')) continue;

      // Extract variable name (before any property access)
      const varName = varRef.split('.')[0];
      const normalized = varName.toLowerCase().replace(/\s+/g, '');

      // Check if there's a typo (space or case mismatch)
      if (!declaredVars.has(normalized)) continue;

      const correctName = declaredVars.get(normalized)!;
      if (varName !== correctName) {
        const before = `{{${varRef}}}`;
        const after = `{{${varRef.replace(varName, correctName)}}}`;

        // Replace in inputs
        const newInputsStr = inputsStr.replace(before, after);
        step.inputs = JSON.parse(newInputsStr);

        fixes.push({
          stepId: step.id,
          type: 'VARIABLE_NAME_TYPO',
          before,
          after,
          description: `Fixed variable name: "${varName}" → "${correctName}"`,
        });
      }
    }
  }
}

/**
 * Fix 6: Module path case sensitivity
 * Only converts category.namespace to lowercase, fixes known function name cases
 */
function fixModulePathCase(workflow: Workflow): void {
  // Build valid module paths from registry
  const registry = getModuleRegistry();
  const validPaths = new Set<string>();
  const pathVariants = new Map<string, string>(); // lowercase -> correct path

  registry.forEach((category) => {
    category.modules.forEach((module) => {
      module.functions.forEach((fn) => {
        const correctPath = `${category.name.toLowerCase()}.${module.name}.${fn.name}`;
        validPaths.add(correctPath);

        // Map lowercase variant to correct path
        const lowercasePath = correctPath.toLowerCase();
        pathVariants.set(lowercasePath, correctPath);
      });
    });
  });

  for (const step of workflow.config.steps) {
    const originalModule = step.module;
    const parts = originalModule.split('.');

    if (parts.length !== 3) continue; // Should be category.namespace.function

    // If module already exists in valid paths, no fix needed
    if (validPaths.has(originalModule)) {
      continue;
    }

    // Try to find correct path by lowercase matching
    const lowercaseModule = originalModule.toLowerCase();
    const correctedModule = pathVariants.get(lowercaseModule);

    if (correctedModule && correctedModule !== originalModule) {
      step.module = correctedModule;
      fixes.push({
        stepId: step.id,
        type: 'MODULE_PATH_CASE',
        before: originalModule,
        after: correctedModule,
        description: `Fixed module path case`,
      });
    }
  }
}

/**
 * Fix 7: Rename array parameter to arr for functions that expect it
 */
function fixArrayParameterNames(workflow: Workflow): void {
  // Functions that expect `arr` as first parameter
  const ARR_PARAM_FUNCTIONS = [
    'utilities.array-utils.pluck',
    'utilities.array-utils.sortBy',
    'utilities.array-utils.groupBy',
    'utilities.array-utils.countBy',
    'utilities.array-utils.filterBy',
    'utilities.array-utils.findBy',
  ];

  for (const step of workflow.config.steps) {
    if (ARR_PARAM_FUNCTIONS.includes(step.module)) {
      if (step.inputs.array && !step.inputs.arr) {
        const before = JSON.stringify(step.inputs);
        step.inputs.arr = step.inputs.array;
        delete step.inputs.array;
        const after = JSON.stringify(step.inputs);

        fixes.push({
          stepId: step.id,
          type: 'ARRAY_PARAM_RENAME',
          before,
          after,
          description: `Renamed 'array' parameter to 'arr' for ${step.module}`,
        });
      }
    }
  }
}

/**
 * Fix 8: Move returnValue from outputDisplay to config level
 */
function fixOutputDisplayReturnValue(workflow: Workflow): void {
  const outputDisplay = workflow.config.outputDisplay;

  if (outputDisplay && 'returnValue' in outputDisplay) {
    const returnValue = outputDisplay.returnValue;

    fixes.push({
      stepId: 'config',
      type: 'OUTPUT_DISPLAY_RETURN_VALUE',
      before: `outputDisplay.returnValue = ${JSON.stringify(returnValue)}`,
      after: `config.returnValue = ${JSON.stringify(returnValue)}`,
      description: `Moved returnValue from outputDisplay to config level`,
    });

    // Move returnValue to config level
    (workflow.config as Record<string, unknown>).returnValue = returnValue;
    delete outputDisplay.returnValue;
  }
}

/**
 * Suggest returnValue if missing (non-chat workflows only)
 */
function suggestReturnValue(workflow: Workflow): void {
  const config = workflow.config as { returnValue?: string };
  const trigger = workflow.trigger;

  // Skip chat workflows - they auto-return the AI response
  if (trigger?.type === 'chat') {
    return;
  }

  // Skip if returnValue already exists
  if (config.returnValue) {
    return;
  }

  // Get the last step with an outputAs
  const lastStep = workflow.config.steps
    .slice()
    .reverse()
    .find(step => step.outputAs);

  if (lastStep?.outputAs) {
    fixes.push({
      stepId: 'config',
      type: 'MISSING_RETURN_VALUE',
      before: `(no returnValue specified)`,
      after: `"returnValue": "{{${lastStep.outputAs}}}"`,
      description: `Add returnValue to avoid exposing internal variables. Suggested: {{${lastStep.outputAs}}}`,
    });

    // Note: We don't auto-apply this fix since it's a suggestion
    // User should decide which variable to return
  }
}

/**
 * Main auto-fix function
 */
function autoFixWorkflow(workflow: Workflow): Workflow {
  console.log('🔧 Auto-fixing workflow...\n');

  fixAISDKParameterFormat(workflow);
  fixAISDKMinTokens(workflow);
  fixAISDKContentReferences(workflow);
  fixZipToObjectsArrays(workflow);
  fixArrayFunctionParameters(workflow);
  fixArrayParameterNames(workflow);
  fixOutputDisplayReturnValue(workflow);
  fixVariableNameTypos(workflow);
  fixModulePathCase(workflow);
  suggestReturnValue(workflow); // Note: This is a suggestion, not auto-applied

  return workflow;
}

/**
 * Print fixes report
 */
function printFixesReport(): void {
  if (fixes.length === 0) {
    console.log('✅ No issues found - workflow is already correct!\n');
    return;
  }

  console.log(`\n📋 Applied ${fixes.length} fixes:\n`);

  const groupedFixes = fixes.reduce((acc, fix) => {
    if (!acc[fix.type]) acc[fix.type] = [];
    acc[fix.type].push(fix);
    return acc;
  }, {} as Record<string, Fix[]>);

  for (const [type, typeFixes] of Object.entries(groupedFixes)) {
    console.log(`\n${getTypeIcon(type)} ${getTypeName(type)} (${typeFixes.length})`);
    for (const fix of typeFixes) {
      console.log(`   Step "${fix.stepId}": ${fix.description}`);
    }
  }

  console.log('');
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    AI_SDK_OPTIONS_WRAPPER: '🤖',
    AI_SDK_MIN_TOKENS: '🎯',
    AI_SDK_CONTENT_ACCESS: '📝',
    ZIPTOOBJECTS_STRING_TO_ARRAY: '🔄',
    ARRAY_FUNCTION_REST_PARAMS: '📊',
    ARRAY_FUNCTION_SEPARATE_PARAMS: '📊',
    ARRAY_PARAM_RENAME: '🔀',
    OUTPUT_DISPLAY_RETURN_VALUE: '📤',
    VARIABLE_NAME_TYPO: '✏️',
    MODULE_PATH_CASE: '🔡',
  };
  return icons[type] || '🔧';
}

function getTypeName(type: string): string {
  const names: Record<string, string> = {
    AI_SDK_OPTIONS_WRAPPER: 'AI SDK Options Wrapper',
    AI_SDK_MIN_TOKENS: 'AI SDK Minimum Tokens',
    AI_SDK_CONTENT_ACCESS: 'AI SDK Content Access',
    ZIPTOOBJECTS_STRING_TO_ARRAY: 'zipToObjects Array Conversion',
    ARRAY_FUNCTION_REST_PARAMS: 'Array Function Rest Parameters',
    ARRAY_FUNCTION_SEPARATE_PARAMS: 'Array Function Separate Parameters',
    ARRAY_PARAM_RENAME: 'Array Parameter Rename',
    OUTPUT_DISPLAY_RETURN_VALUE: 'Output Display returnValue Position',
    VARIABLE_NAME_TYPO: 'Variable Name Typos',
    MODULE_PATH_CASE: 'Module Path Case',
  };
  return names[type] || type;
}

/**
 * CLI
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npx tsx scripts/auto-fix-workflow.ts <workflow-file.json> [--write]');
    process.exit(1);
  }

  const filePath = resolve(args[0]);
  const shouldWrite = args.includes('--write');

  try {
    // Read workflow
    const fileContent = readFileSync(filePath, 'utf-8');
    const workflow: Workflow = JSON.parse(fileContent);

    console.log(`📂 Processing: ${filePath}`);
    console.log(`📝 Workflow: ${workflow.name}\n`);

    // Apply fixes
    const fixedWorkflow = autoFixWorkflow(workflow);

    // Print report
    printFixesReport();

    if (fixes.length > 0) {
      if (shouldWrite) {
        // Write fixed workflow
        writeFileSync(filePath, JSON.stringify(fixedWorkflow, null, 2) + '\n');
        console.log(`✅ Fixes written to: ${filePath}\n`);
      } else {
        console.log('💡 To apply these fixes, run with --write flag\n');
        console.log(`   npx tsx scripts/auto-fix-workflow.ts ${args[0]} --write\n`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
