import i18n from "@/app/i18n";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NotificationDemo, OpenLinkDemo } from "./demo";

const { isPermissionGranted, requestPermission, sendNotification } = vi.hoisted(() => ({
  isPermissionGranted: vi.fn(),
  requestPermission: vi.fn(),
  sendNotification: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-notification", () => ({
  isPermissionGranted,
  requestPermission,
  sendNotification,
}));

const { openUrl, platformMock } = vi.hoisted(() => ({
  openUrl: vi.fn(),
  platformMock: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-opener", () => ({ openUrl }));
vi.mock("@tauri-apps/plugin-os", () => ({ platform: platformMock }));

describe("NotificationDemo", () => {
  it("shows the granted permission status once isPermissionGranted resolves", async () => {
    isPermissionGranted.mockResolvedValue(true);

    render(<NotificationDemo onError={vi.fn()} />);

    expect(screen.getByText(i18n.t("demo.notification.permissionChecking"))).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(i18n.t("demo.notification.permissionGranted"))).toBeInTheDocument();
    });
  });

  it("shows the dev-mode note about macOS discarding un-bundled notifications", async () => {
    isPermissionGranted.mockResolvedValue(true);

    render(<NotificationDemo onError={vi.fn()} />);

    expect(screen.getByText(i18n.t("demo.notification.devNote"))).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(i18n.t("demo.notification.permissionGranted"))).toBeInTheDocument();
    });
  });

  it("reports the denied error and updates the status when permission is refused", async () => {
    isPermissionGranted.mockResolvedValue(false);
    requestPermission.mockResolvedValue("denied");
    const onError = vi.fn();
    const user = userEvent.setup();

    render(<NotificationDemo onError={onError} />);
    await user.click(screen.getByRole("button", { name: i18n.t("demo.notification.send") }));

    expect(onError).toHaveBeenCalledWith(i18n.t("demo.notification.denied"));
    expect(sendNotification).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.getByText(i18n.t("demo.notification.permissionNotGranted")),
      ).toBeInTheDocument();
    });
  });
});

describe("OpenLinkDemo", () => {
  it("shows the Safari button on macOS and opens the URL with Safari specified", async () => {
    platformMock.mockReturnValue("macos");
    const user = userEvent.setup();

    render(<OpenLinkDemo onError={vi.fn()} />);

    const safariButton = await screen.findByRole("button", {
      name: i18n.t("demo.openLink.openWithSafari"),
    });
    await user.click(safariButton);

    expect(openUrl).toHaveBeenCalledWith("https://tauri.app", "Safari");
  });

  it("does not show the Safari button on other platforms", async () => {
    platformMock.mockReturnValue("windows");

    render(<OpenLinkDemo onError={vi.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: i18n.t("demo.openLink.open") }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: i18n.t("demo.openLink.openWithSafari") }),
    ).not.toBeInTheDocument();
  });
});
