import { describe, expect, it } from "vitest";
import RootLayout, { metadata } from "./layout";

describe("RootLayout", () => {
  it("provides document metadata and wraps content in an English document", () => {
    const layout = RootLayout({ children: <main>Workspace</main> });

    expect(metadata).toMatchObject({
      title: "URL Shortener",
      description: "Create and manage short links.",
    });
    expect(layout.props.lang).toBe("en");
    expect(layout.props.children.props.children).toEqual(<main>Workspace</main>);
  });
});
