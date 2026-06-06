from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
import os

# =========================
# PATH CONFIGURATION
# =========================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_PATH = os.path.join(BASE_DIR, "bridge_dataset.csv")

FRONTEND_DIR = os.path.abspath(
    os.path.join(BASE_DIR, "..", "frontend")
)

# =========================
# FLASK APP
# =========================

app = Flask(
    __name__,
    static_folder=FRONTEND_DIR,
    static_url_path=""
)

CORS(app)

df = pd.read_csv(DATASET_PATH)

current_index = 0

# =========================
# API ROUTES
# =========================

@app.route("/api/history")
def history():
    return jsonify(
        df.head(50).to_dict(orient="records")
    )


@app.route("/api/live")
def live():
    global current_index

    row = df.iloc[current_index].to_dict()

    row["temperature_c"] += np.random.uniform(-0.2, 0.2)
    row["wind_speed_mps"] += np.random.uniform(-0.5, 0.5)

    current_index += 1

    if current_index >= len(df):
        current_index = 0

    return jsonify(row)


@app.route("/api/summary")
def summary():
    return jsonify({
        "avg_temp": float(df["temperature_c"].mean()),
        "avg_humidity": float(df["humidity_percent"].mean()),
        "avg_wind": float(df["wind_speed_mps"].mean()),
        "avg_degradation": float(df["degradation_score"].mean())
    })


@app.route("/api/status")
def status():
    return jsonify({
        "system": "SMART BRIDGE FINAL SYSTEM",
        "status": "ONLINE",
        "frontend": "served by Flask",
        "api": "running"
    })


# =========================
# FRONTEND ROUTES
# =========================

@app.route("/")
def serve_index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:path>")
def serve_static_files(path):
    file_path = os.path.join(FRONTEND_DIR, path)

    if os.path.exists(file_path):
        return send_from_directory(FRONTEND_DIR, path)

    return send_from_directory(FRONTEND_DIR, "index.html")


# =========================
# LOCAL DEVELOPMENT
# =========================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )