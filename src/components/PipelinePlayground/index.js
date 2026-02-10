import React, { useState } from "react";
import PipelineEditor from "../PipelineEditor";
import styles from "./styles.module.css";

const DEFAULT_BASE_URL = "https://eaas.aparavi.com/";

export default function PipelinePlayground({ defaultConfig }) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);

  return (
    <div className={styles.container}>
      <div className={styles.credentialSection}>
        <h3 className={styles.credentialTitle}>API Credentials</h3>
        <p className={styles.privacyNote}>
          Your credentials stay in the browser and are sent directly to the
          Aparavi API. They are never sent to this site's server.
        </p>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.label}>
              API Key <span className={styles.required}>*</span>
            </span>
            <input
              type="password"
              className={styles.input}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Aparavi API key"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Base URL</span>
            <input
              type="text"
              className={styles.input}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={DEFAULT_BASE_URL}
            />
          </label>
        </div>
      </div>

      <PipelineEditor
        defaultConfig={defaultConfig}
        apiKey={apiKey}
        baseUrl={baseUrl}
      />
    </div>
  );
}
