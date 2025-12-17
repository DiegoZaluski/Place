export interface LlamaConfigEventDetail {
  id_model: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  tokens?: number;
  repeat_penalty?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  min_p?: number;
  tfs_z?: number;
  mirostat_tau?: number;
  seed?: number | null;
  stop?: string[] | null;
}

export function dispatchLlamaConfigEvent(
  targetElement: HTMLElement,
  detail: LlamaConfigEventDetail,
): void {
  if (!detail.id_model) {
    throw new Error('The \'id_model\' is required to trigger event.');
  }

  const eventCofigLlm = new CustomEvent<LlamaConfigEventDetail>('configLlm', {
    detail: detail,
    bubbles: true,
    cancelable: true,
  });

  targetElement.dispatchEvent(eventCofigLlm);
}
