#[cfg(target_os = "windows")]
fn wakeup_display() -> anyhow::Result<()> {
    use windows::Win32::UI::Input::KeyboardAndMouse::{
        SendInput, INPUT, INPUT_0, INPUT_MOUSE, MOUSEEVENTF_MOVE, MOUSEINPUT,
    };

    let input = INPUT {
        r#type: INPUT_MOUSE,
        Anonymous: INPUT_0 {
            mi: MOUSEINPUT {
                dx: 0,
                dy: 0,
                dwFlags: MOUSEEVENTF_MOVE,
                ..Default::default()
            },
        },
    };
    let v: [INPUT; 1] = [input];
    let size = std::mem::size_of_val::<INPUT>(&input) as i32;
    let _ret = unsafe { SendInput(&v, size) };

    Ok(())
}

#[cfg(target_os = "linux")]
fn wakeup_display() -> anyhow::Result<()> {
    anyhow::bail!("Wakeup is not implemented for linux");
}

fn main() -> anyhow::Result<()> {
    wakeup_display()
}
