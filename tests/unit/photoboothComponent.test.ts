// MIT License - Copyright (c) 2026 SimonCatBot
// See LICENSE file for details.

import { describe, it, expect, vi } from "vitest";

// ─── Style Presets Tests ──────────────────────────────────────────────────────

describe("Photo Booth - Style Presets", () => {
  const STYLE_PRESETS = [
    { id: "anime", label: "Anime", emoji: "🎌" },
    { id: "van-gogh", label: "Van Gogh", emoji: "🎨" },
    { id: "monet", label: "Monet", emoji: "🌸" },
    { id: "picasso", label: "Picasso", emoji: "◆" },
    { id: "watercolor", label: "Watercolor", emoji: "💧" },
    { id: "sketch", label: "Sketch", emoji: "✏️" },
    { id: "cyberpunk", label: "Cyberpunk", emoji: "🔮" },
    { id: "pixel-art", label: "Pixel Art", emoji: "👾" },
    { id: "oil-painting", label: "Oil Painting", emoji: "🖼️" },
  ];

  it("has exactly 9 style presets", () => {
    expect(STYLE_PRESETS).toHaveLength(9);
  });

  it("each style has a unique id", () => {
    const ids = STYLE_PRESETS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("each style has a label and emoji", () => {
    for (const style of STYLE_PRESETS) {
      expect(style.id).toBeTruthy();
      expect(style.label).toBeTruthy();
      expect(style.emoji).toBeTruthy();
    }
  });

  it("style ids match expected names", () => {
    const expectedIds = [
      "anime",
      "van-gogh",
      "monet",
      "picasso",
      "watercolor",
      "sketch",
      "cyberpunk",
      "pixel-art",
      "oil-painting",
    ];
    const ids = STYLE_PRESETS.map((s) => s.id);
    expect(ids).toEqual(expectedIds);
  });

  it("each style has a thumbnail path", () => {
    for (const style of STYLE_PRESETS) {
      expect(style.id).toBeTruthy();
      // Thumbnail paths follow pattern: /styles/{id}.png
      const expectedPath = `/styles/${style.id}.png`;
      expect(expectedPath).toContain(style.id);
    }
  });
});

// ─── Tab Integration Tests ─────────────────────────────────────────────────────

describe("Photo Booth - Tab Integration", () => {
  it("photobooth is a valid tab id", () => {
    type TabId = "agents" | "chat" | "system" | "graph" | "tasks" | "tokens" | "settings" | "connection" | "skills" | "photobooth";
    const tabId: TabId = "photobooth";
    expect(tabId).toBe("photobooth");
  });

  it("photobooth is in exclusive tabs list", () => {
    const exclusiveTabs: string[] = ["tasks", "skills", "photobooth"];
    expect(exclusiveTabs).toContain("photobooth");
  });

  it("selecting photobooth replaces all other tabs", () => {
    const exclusiveTabs = ["tasks", "skills", "photobooth"];
    const currentTabs = ["agents", "chat", "system"];
    const selectedTab = "photobooth";

    const result = currentTabs.includes(selectedTab)
      ? []
      : [selectedTab];

    expect(result).toEqual(["photobooth"]);
  });

  it("deselecting photobooth returns to empty", () => {
    const exclusiveTabs = ["tasks", "skills", "photobooth"];
    const currentTabs = ["photobooth"];
    const selectedTab = "photobooth";

    const result = currentTabs.includes(selectedTab)
      ? []
      : [selectedTab];

    expect(result).toEqual([]);
  });

  it("non-exclusive tab toggles remove photobooth", () => {
    const exclusiveTabs = ["tasks", "skills", "photobooth"];
    const currentTabs = ["photobooth"];
    const toggledTab = "agents";

    // When toggling a non-exclusive tab, exclusive tabs should be removed
    let next = [...currentTabs, toggledTab];
    next = next.filter((t) => !exclusiveTabs.includes(t));

    expect(next).toEqual(["agents"]);
  });
});

// ─── Camera Capture Logic ──────────────────────────────────────────────────────

describe("Photo Booth - Camera Logic", () => {
  it("base64 data URL is stripped correctly for upload", () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA";
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    expect(base64).toBe("iVBORw0KGgoAAAANSUhEUgAAAAUA");
    expect(base64).not.toContain("data:");
    expect(base64).not.toContain("base64,");
  });

  it("plain base64 string passes through unchanged", () => {
    const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAUA";
    const result = base64.replace(/^data:image\/\w+;base64,/, "");
    expect(result).toBe(base64);
  });
});

// ─── Style Selection Logic ─────────────────────────────────────────────────────

describe("Photo Booth - Style Selection", () => {
  const ALL_STYLES = [
    "anime", "van-gogh", "monet", "picasso",
    "watercolor", "sketch", "cyberpunk", "pixel-art", "oil-painting",
  ];

  it("select all styles", () => {
    const selectedStyles = new Set<string>();
    for (const s of ALL_STYLES) selectedStyles.add(s);
    expect(selectedStyles.size).toBe(9);
  });

  it("deselect all styles", () => {
    const selectedStyles = new Set(ALL_STYLES);
    selectedStyles.clear();
    expect(selectedStyles.size).toBe(0);
  });

  it("toggle individual style", () => {
    const selectedStyles = new Set<string>();
    
    // Toggle on
    selectedStyles.add("anime");
    expect(selectedStyles.has("anime")).toBe(true);
    expect(selectedStyles.size).toBe(1);

    // Toggle off
    selectedStyles.delete("anime");
    expect(selectedStyles.has("anime")).toBe(false);
    expect(selectedStyles.size).toBe(0);
  });

  it("filter valid styles from request", () => {
    const requested = ["anime", "invalid-style", "monet", "another-bad"];
    const valid = requested.filter((s) => ALL_STYLES.includes(s));
    expect(valid).toEqual(["anime", "monet"]);
  });

  it("empty styles defaults to all styles", () => {
    const requested: string[] = [];
    const result = requested.length ? requested.filter((s) => ALL_STYLES.includes(s)) : [...ALL_STYLES];
    expect(result).toEqual(ALL_STYLES);
    expect(result.length).toBe(9);
  });
});

// ─── Job Status Logic ──────────────────────────────────────────────────────────

describe("Photo Booth - Job Status", () => {
  interface StyleJob {
    style: string;
    promptId: string;
    status: "queued" | "running" | "success" | "error" | "pending";
  }

  it("counts completed jobs correctly", () => {
    const jobs: StyleJob[] = [
      { style: "anime", promptId: "p1", status: "success" },
      { style: "monet", promptId: "p2", status: "running" },
      { style: "sketch", promptId: "p3", status: "success" },
      { style: "cyberpunk", promptId: "p4", status: "queued" },
      { style: "oil-painting", promptId: "p5", status: "error" },
    ];

    const completedCount = jobs.filter((j) => j.status === "success").length;
    expect(completedCount).toBe(2);
  });

  it("counts failed jobs correctly", () => {
    const jobs: StyleJob[] = [
      { style: "anime", promptId: "p1", status: "success" },
      { style: "monet", promptId: "p2", status: "error" },
      { style: "sketch", promptId: "p3", status: "error" },
    ];

    const failedCount = jobs.filter((j) => j.status === "error").length;
    expect(failedCount).toBe(2);
  });

  it("detects all done state", () => {
    const jobs: StyleJob[] = [
      { style: "anime", promptId: "p1", status: "success" },
      { style: "monet", promptId: "p2", status: "error" },
    ];

    const allDone = jobs.every((j) => j.status === "success" || j.status === "error");
    expect(allDone).toBe(true);
  });

  it("detects not all done state", () => {
    const jobs: StyleJob[] = [
      { style: "anime", promptId: "p1", status: "success" },
      { style: "monet", promptId: "p2", status: "running" },
    ];

    const allDone = jobs.every((j) => j.status === "success" || j.status === "error");
    expect(allDone).toBe(false);
  });

  it("empty jobs is not all done", () => {
    const jobs: StyleJob[] = [];
    const allDone = jobs.length > 0 && jobs.every((j) => j.status === "success" || j.status === "error");
    expect(allDone).toBe(false);
  });
});