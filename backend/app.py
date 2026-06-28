from flask import Flask, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import score
import db

app = Flask(__name__)
db.init_db()

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[],
    storage_uri="memory://",
)

@app.route('/submit', methods=['POST'])
@limiter.limit("10 per minute;100 per day")
def send_data():
    data = request.get_json()
    text = data.get("text", "")
    perplexity_result = score.score_perplexity(text)
    burstiness_result = score.score_burstiness(text)
    total = round(perplexity_result["score"] * 0.5 + burstiness_result["score"] * 0.5, 2)

    if total < 0.36:
        attribution = "likely human"
    elif total < 0.71:
        attribution = "uncertain"
    else:
        attribution = "likely AI"
    db.log_event({
        "content_id":  data.get("content_id", "unknown"),
        "creator_id":  data.get("creator_id", "unknown"),
        "attribution": attribution,
        "confidence":  total,
        "status":      "analyzed",
        "text":        text,
    })

    return jsonify({"score": total, "attribution": attribution, "status": "received"}), 200

@app.route('/log', methods=['GET'])
def get_log():
    limit = request.args.get("limit", 20, type=int)
    entries = db.read_log(limit=limit)
    return jsonify(entries), 200

if __name__ == '__main__':
    app.run(debug=True)
