import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [msg, setMsg] = useState("");

  const testRustBridge = async () => {
    const response: string = await invoke("greet", { name: "Developer" });
    setMsg(response);
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>APT Store</h1>
      <button onClick={testRustBridge}>Test Rust Connection</button>
      {msg && <p style={{ marginTop: "1rem", color: "green" }}>{msg}</p>}
    </main>
  );
}

export default App;
