'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { OutputRenderer } from './output-renderer';
import { OutputDisplayConfig } from '@/lib/workflows/analyze-output-display';

interface WorkflowRun {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  output: unknown;
  error: string | null;
  errorStep: string | null;
  triggerType: string;
}

interface RunOutputModalProps {
  run: WorkflowRun | null;
  modulePath?: string;
  workflowConfig?: Record<string, unknown>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RunOutputModal({
  run,
  modulePath,
  workflowConfig,
  open,
  onOpenChange,
}: RunOutputModalProps) {
  if (!run) return null;

  // Extract outputDisplay config from workflow config if provided
  // Transform from workflow JSON format to OutputDisplayConfig format
  // workflowConfig might be: { config: { outputDisplay: {...} } } OR { steps: [...], outputDisplay: {...} }
  // OR it might be a string that needs parsing
  let parsedConfig = workflowConfig;

  // If workflowConfig is a string, parse it
  if (typeof workflowConfig === 'string') {
    try {
      parsedConfig = JSON.parse(workflowConfig);
    } catch (error) {
      console.error('Failed to parse workflowConfig:', error);
      parsedConfig = undefined;
    }
  }

  // Try to get config object and outputDisplay
  // Handle two cases: parsedConfig might be the full workflow object OR just the config object
  const parsedConfigRecord = parsedConfig as Record<string, unknown> | undefined;
  const hasConfigProperty = parsedConfigRecord?.config !== undefined;
  const configObj = hasConfigProperty
    ? (parsedConfigRecord.config as Record<string, unknown>)
    : parsedConfigRecord;

  const outputDisplay = configObj?.outputDisplay as Record<string, unknown> | undefined;

  // Extract returnValue - check both correct location (config.returnValue) and legacy location (outputDisplay.returnValue)
  const returnValue = (configObj?.returnValue as string | undefined) || (outputDisplay?.returnValue as string | undefined);

  // Apply returnValue to extract the specific data from run.output if configured
  let processedOutput = run.output;
  if (returnValue && run.output && typeof run.output === 'object') {
    // Parse template string like "{{sortedProducts}}" or "{{result.data}}"
    const match = returnValue.match(/^\{\{([^}]+)\}\}$/);
    if (match) {
      const path = match[1].trim();
      const keys = path.split('.');
      let value: unknown = run.output;

      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = (value as Record<string, unknown>)[key];
        } else {
          // Path not found, use original output
          console.warn(`[RunOutputModal] returnValue path "${path}" not found in output, using full output`);
          value = run.output;
          break;
        }
      }

      console.log(`[RunOutputModal] Applied returnValue: "${returnValue}", extracted:`, Array.isArray(value) ? `array[${value.length}]` : typeof value);
      processedOutput = value;
    }
  } else if (returnValue) {
    console.log(`[RunOutputModal] returnValue configured but not applied:`, { returnValue, hasOutput: !!run.output, isObject: typeof run.output === 'object' });
  } else if (!returnValue && run.output && typeof run.output === 'object' && !Array.isArray(run.output)) {
    // No returnValue specified - auto-filter internal variables
    console.log('[RunOutputModal] No returnValue - applying auto-detection filter');
    const internalKeys = ['user', 'trigger'];
    const filteredOutput: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(run.output as Record<string, unknown>)) {
      // Skip internal variables
      if (internalKeys.includes(key)) continue;
      // Skip credential variables
      if (key.includes('_apikey') || key.includes('_api_key')) continue;
      // Skip known credential platforms
      if (['openai', 'anthropic', 'youtube', 'slack', 'twitter', 'github', 'reddit'].includes(key)) continue;

      filteredOutput[key] = value;
    }

    // If we have filtered variables, use them; otherwise use original (backward compat)
    if (Object.keys(filteredOutput).length > 0) {
      console.log('[RunOutputModal] Filtered output keys:', Object.keys(filteredOutput));
      processedOutput = filteredOutput;
    }
  }

  const outputDisplayHint = outputDisplay
    ? ({
        type: outputDisplay.type as string,
        config: {
          columns: outputDisplay.columns,
        },
      } as OutputDisplayConfig)
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[98vw] !w-[98vw] max-h-[95vh] overflow-auto p-6 pt-12">
        <DialogTitle className="sr-only">Workflow Output</DialogTitle>
        <DialogDescription className="sr-only">
          Workflow execution output
        </DialogDescription>
        {run.status === 'success' && run.output !== undefined ? (
          <OutputRenderer
            output={processedOutput}
            modulePath={modulePath}
            displayHint={outputDisplayHint}
          />
        ) : run.status === 'error' ? (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
            <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
              Error Details
            </h4>
            <p className="text-sm text-red-600 dark:text-red-400">
              {run.error || 'Unknown error occurred'}
            </p>
            {run.errorStep && (
              <p className="text-xs text-muted-foreground mt-2">
                Failed at step: {run.errorStep}
              </p>
            )}
          </div>
        ) : run.status === 'running' ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Workflow is still running...</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">
              No output available.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
