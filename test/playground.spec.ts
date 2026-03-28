import { describe, expect, it } from "vitest";

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

describe("playground demo app", () => {
  it("mounts through the router and navigates with hash routes", async () => {
    document.body.innerHTML = "";
    window.history.replaceState({}, "", "/");
    window.location.hash = "";

    await import("../apps/playground/App");
    await wait();

    const root = document.querySelector<HTMLElement>("[data-ce-playground-root]");

    expect(root).toBeTruthy();
    expect(root?.firstElementChild?.tagName.toLowerCase()).toBe("main-app");

    const mainApp = root?.firstElementChild as HTMLElement;
    const toUsersButton = mainApp.shadowRoot?.querySelector("button") as HTMLButtonElement;
    toUsersButton.click();

    await wait();

    expect(window.location.hash).toBe("#/users");
    expect(root?.firstElementChild?.tagName.toLowerCase()).toBe("users-page");
  });
});
