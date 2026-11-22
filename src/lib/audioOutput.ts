/** Audio output (sink) selection for the on-air player. */

export type AudioSink = {
  deviceId: string;
  label: string;
};

type SinkCapable = HTMLMediaElement & {
  setSinkId?: (sinkId: string) => Promise<void>;
};

type MediaDevicesWithOutputPicker = MediaDevices & {
  selectAudioOutput?: (options?: {
    deviceId?: string;
  }) => Promise<MediaDeviceInfo>;
};

function mediaDevicesExt(): MediaDevicesWithOutputPicker | undefined {
  return navigator.mediaDevices as MediaDevicesWithOutputPicker | undefined;
}

export function canSetSinkId(): boolean {
  return (
    typeof HTMLMediaElement !== "undefined" &&
    typeof (HTMLMediaElement.prototype as SinkCapable).setSinkId === "function"
  );
}

export function canSelectAudioOutput(): boolean {
  return typeof mediaDevicesExt()?.selectAudioOutput === "function";
}

/** List audio output devices. May be empty until mic permission unlocks labels. */
export async function listAudioSinks(): Promise<AudioSink[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  try {
    // Soft permission probe so Chromium fills device labels (no capture kept).
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const t of stream.getTracks()) t.stop();
  } catch {
    /* labels may stay blank; still list devices */
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((d) => d.kind === "audiooutput")
    .map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label || `Speaker ${i + 1}`,
    }));
}

export async function applySinkId(
  el: HTMLMediaElement | null,
  sinkId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!el) return { ok: false, error: "No media element" };
  const media = el as SinkCapable;
  if (typeof media.setSinkId !== "function") {
    return { ok: false, error: "setSinkId not supported in this browser" };
  }
  try {
    await media.setSinkId(sinkId);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Chrome 110+ picker when available (user gesture required). */
export async function pickAudioOutputWithBrowserUi(): Promise<string | null> {
  const select = mediaDevicesExt()?.selectAudioOutput;
  if (!select) return null;
  try {
    const device = await select();
    return device.deviceId;
  } catch {
    return null;
  }
}
