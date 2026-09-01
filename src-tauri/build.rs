fn main() {
    tauri_build::build();

    // tauri-build only embeds the Common Controls v6 manifest into `[[bin]]`
    // targets (`cargo:rustc-link-arg-bins`), not into `cargo test` binaries.
    // Without it, test executables load Common Controls v5 and fail to start
    // with STATUS_ENTRYPOINT_NOT_FOUND as soon as they link anything that
    // depends on Tauri's Windows dialog code (e.g. `tauri::test::mock_app`).
    // See https://github.com/tauri-apps/tauri/issues/13419.
    //
    // Cargo has no stable per-artifact-kind "tests only" build-script
    // instruction (`cargo:rustc-link-arg-tests` exists but requires the
    // nightly-only `-Z extra-link-arg`, confirmed by trying it: stable cargo
    // rejects it with "invalid instruction"). The *unscoped* `cargo:rustc-link-arg`
    // is stable but applies to every artifact built in the invocation,
    // including `[[bin]]` — which would collide with tauri-build's own
    // manifest resource (both would claim resource ID 1) and break the real
    // app build. So this is gated behind an env var that CI sets only for the
    // `cargo test` step, never for the `tauri build` step, keeping the two
    // invocations' build-script output independent.
    println!("cargo:rerun-if-env-changed=TAURI_APP_TEMPLATE_EMBED_TEST_MANIFEST");
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("windows")
        && std::env::var("TAURI_APP_TEMPLATE_EMBED_TEST_MANIFEST").is_ok()
    {
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let manifest_path = std::path::Path::new(&manifest_dir).join("windows-test-manifest.xml");
        println!("cargo:rustc-link-arg=/MANIFEST:EMBED");
        println!(
            "cargo:rustc-link-arg=/MANIFESTINPUT:{}",
            manifest_path.display()
        );
    }
}
