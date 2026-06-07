from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import os
import math
from datetime import datetime

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

# =========================
# LOAD DATASET
# =========================

df = pd.read_csv(DATASET_PATH)

# pastikan timestamp terbaca sebagai waktu
df["timestamp"] = pd.to_datetime(
    df["timestamp"],
    errors="coerce"
)

# kalau timestamp gagal terbaca, buat timestamp simulasi
if df["timestamp"].isna().all():
    df["timestamp"] = pd.date_range(
        end=pd.Timestamp.now(),
        periods=len(df),
        freq="H"
    )

# normalisasi waktu dataset agar data lama tetap terasa seperti data saat ini
latest_source_time = df["timestamp"].max()
current_time = pd.Timestamp.now()
time_shift = current_time - latest_source_time

df["display_timestamp"] = df["timestamp"] + time_shift

current_index = 0

# =========================
# HELPER FUNCTIONS
# =========================

def compress_dataframe(data, max_points=300):
    if len(data) <= max_points:
        return data

    step = math.ceil(len(data) / max_points)
    return data.iloc[::step]


def format_dataframe(data):
    output = data.copy()

    output["original_timestamp"] = output["timestamp"].dt.strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    output["timestamp"] = output["display_timestamp"].dt.strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    output = output.drop(columns=["display_timestamp"])

    return output.to_dict(orient="records")


def get_filtered_data(range_name):
    now = pd.Timestamp.now()

    if range_name == "today":
        start_time = now.normalize()

    elif range_name == "week":
        start_time = now - pd.Timedelta(days=7)

    elif range_name == "month":
        start_time = now - pd.Timedelta(days=30)

    elif range_name == "year":
        start_time = now - pd.Timedelta(days=365)

    else:
        start_time = df["display_timestamp"].min()

    filtered = df[df["display_timestamp"] >= start_time].copy()

    if filtered.empty:
        filtered = df.tail(50).copy()

    filtered = filtered.sort_values("display_timestamp")

    filtered = compress_dataframe(filtered, max_points=300)

    return filtered


def get_last_update_text():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# =========================
# API ROUTES
# =========================

@app.route("/api/history")
def history():
    range_name = request.args.get("range", "today")

    filtered = get_filtered_data(range_name)

    return jsonify({
        "range": range_name,
        "count": int(len(filtered)),
        "last_update": get_last_update_text(),
        "data": format_dataframe(filtered)
    })


@app.route("/api/live")
def live():
    global current_index

    row = df.iloc[current_index].copy()

    row["temperature_c"] += np.random.uniform(-0.2, 0.2)
    row["wind_speed_mps"] += np.random.uniform(-0.5, 0.5)

    original_timestamp = row["timestamp"]
    display_timestamp = row["display_timestamp"]

    row = row.drop(labels=["display_timestamp"])

    data = row.to_dict()

    data["original_timestamp"] = original_timestamp.strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    data["timestamp"] = display_timestamp.strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    data["last_update"] = get_last_update_text()

    current_index += 1

    if current_index >= len(df):
        current_index = 0

    return jsonify(data)


@app.route("/api/summary")
def summary():
    range_name = request.args.get("range", "today")

    filtered = get_filtered_data(range_name)

    return jsonify({
        "range": range_name,
        "count": int(len(filtered)),
        "last_update": get_last_update_text(),
        "avg_temp": float(filtered["temperature_c"].mean()),
        "avg_humidity": float(filtered["humidity_percent"].mean()),
        "avg_wind": float(filtered["wind_speed_mps"].mean()),
        "avg_degradation": float(filtered["degradation_score"].mean()),
        "avg_forecast": float(filtered["forecast_score_next_30d"].mean())
    })


@app.route("/api/status")
def status():
    return jsonify({
        "system": "SMART BRIDGE FINAL SYSTEM",
        "status": "ONLINE",
        "frontend": "served by Flask",
        "api": "running",
        "last_update": get_last_update_text()
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