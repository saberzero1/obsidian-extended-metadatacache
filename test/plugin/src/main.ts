import { Plugin } from "obsidian";
import { getAPI } from "obsidian-extended-metadatacache";
import type { ExtendedMetadataCacheHandle } from "obsidian-extended-metadatacache";

declare global {
  interface Window {
    extendedMetadataCache: ExtendedMetadataCacheHandle | null;
  }
}

export default class TestHostPlugin extends Plugin {
  private handle: ExtendedMetadataCacheHandle | null = null;

  async onload() {
    this.handle = getAPI(this.app, { persist: false });
    window.extendedMetadataCache = this.handle;
  }

  onunload() {
    this.handle?.release();
    this.handle = null;
    window.extendedMetadataCache = null;
  }
}
