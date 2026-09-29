import { useState } from "react";
import type { AppProgress } from "../../types";
import { exportProgress, importProgress } from "../../services/importExport";
import { todayLocal } from "../../utils/date";

export function ProgressDownload({ progress }: { progress: AppProgress }) {
  const [failed, setFailed] = useState(false);
  const download = () => {
    try {
      const url = URL.createObjectURL(new Blob([exportProgress(progress)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `学習記録-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  };
  return <><button type="button" onClick={download}>学習記録をダウンロード</button>{failed && <span role="alert">記録をダウンロードできませんでした。</span>}</>;
}

export function ProgressBackup({ progress, onRestore }: { progress: AppProgress; onRestore: (progress: AppProgress) => void }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return <section className="backup-tools" aria-label="学習記録の保存と復元">
    {progress.setup && <ProgressDownload progress={progress} />}
    <label className="file-label">学習記録をアップロード
      <input type="file" accept=".json,application/json" disabled={busy} onChange={event => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        setBusy(true);
        setMessage("");
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const restored = importProgress(String(reader.result));
            if (progress.setup && !window.confirm("現在の学習記録を、このファイルの記録に置き換えますか。未保存の解答は失われます。必要な記録は先にダウンロードしてください。")) return;
            // Resume at the backed-up study day, rather than advancing for time spent away.
            onRestore({ ...restored, setup: restored.setup ? { ...restored.setup, lastStudyDate: todayLocal() } : undefined });
            setMessage("学習記録を復元しました。");
          } catch {
            setMessage("この記録ファイルは読み込めません。現在の記録は変更していません。");
          } finally {
            setBusy(false);
          }
        };
        reader.onerror = () => { setMessage("ファイルを読み込めませんでした。"); setBusy(false); };
        reader.readAsText(file);
      }} />
    </label>
    {message && <span role="status">{message}</span>}
  </section>;
}
