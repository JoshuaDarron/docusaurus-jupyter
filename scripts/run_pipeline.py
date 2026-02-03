"""Execute the Aparavi pipeline and save results to static/data/pipeline-results.json."""

import json
import os
from pathlib import Path

from dotenv import load_dotenv
from aparavi import AparaviClient

ROOT = Path(__file__).resolve().parent.parent
PIPELINE_CONFIG = ROOT / "pipelines" / "pipeline-config.json"
OUTPUT_PATH = ROOT / "static" / "data" / "pipeline-results.json"


def main():
    load_dotenv(ROOT / ".env")

    api_key = os.environ["APARAVI_API_KEY"]
    base_url = os.environ.get("APARAVI_BASE_URL", "https://eaas.aparavi.com/")

    client = AparaviClient(api_key=api_key, base_url=base_url)

    with open(PIPELINE_CONFIG) as f:
        pipeline = json.load(f)

    print(f"Executing pipeline {pipeline['id']} ...")
    result = client.execute_pipeline_workflow(pipeline)
    print("Pipeline execution complete.")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(result, f, indent=2, default=str)

    print(f"Results saved to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
