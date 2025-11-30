

import json
import os
from typing import Optional, Dict, Any, List

import boto3
from botocore.config import Config

DEFAULT_AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
DEFAULT_CLAUDE = os.getenv("DEFAULT_CLAUDE", "us.anthropic.claude-3-7-sonnet-20250219-v1:0")

DEFAULT_NOVA = os.getenv("DEFAULT_NOVA", "us.amazon.nova-pro-v1:0")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "amazon.titan-embed-text-v2:0")

_clients: Dict[str, Any] = {}


def _client(region: Optional[str]) -> Any:
    region = region or DEFAULT_AWS_REGION
    if region not in _clients:
        _clients[region] = boto3.client(
            "bedrock-runtime",
            region_name=region,
            config=Config(
                retries={"max_attempts": 2, "mode": "standard"},
                read_timeout=25,
                connect_timeout=10,
            ),
        )
    return _clients[region]


def _is_anthropic(model_id: str) -> bool:
    return model_id.startswith(("anthropic.", "eu.anthropic.", "us.anthropic."))


def _ensure_messages_v1(messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # For Nova (messages-v1), each block is {"text": "..."}
    fixed: List[Dict[str, Any]] = []
    for m in messages:
        role = m.get("role", "user")
        parts = m.get("content", [])
        blocks: List[Dict[str, str]] = []
        for p in parts:
            if isinstance(p, dict) and "text" in p:
                blocks.append({"text": str(p["text"])})
            elif isinstance(p, str):
                blocks.append({"text": p})
        if not blocks:
            blocks = [{"text": ""}]
        fixed.append({"role": role, "content": blocks})
    return fixed


def _to_converse(messages: List[Dict[str, Any]], system=None, max_tokens=500, temperature=0.0, top_p=0.9):
    # Anthropic “converse” payload builder
    def to_blocks(msgs):
        out = []
        for m in msgs:
            role = m.get("role", "user")
            text = "".join(p.get("text", "") for p in m.get("content", []) if isinstance(p, dict) and "text" in p)
            out.append({"role": role, "content": [{"text": text}]})
        return out

    params: Dict[str, Any] = {
        "messages": to_blocks(messages),
        "inferenceConfig": {"maxTokens": max_tokens, "temperature": temperature, "topP": top_p},
    }
    if system:
        params["system"] = [{"text": s.get("text", "") if isinstance(s, dict) else str(s)} for s in system]
    return params


def _to_messages_v1(messages, system=None, max_tokens=500, temperature=0.0, top_p=0.9, top_k=40):
    payload: Dict[str, Any] = {
        "schemaVersion": "messages-v1",
        "messages": _ensure_messages_v1(messages),
        "inferenceConfig": {"maxTokens": max_tokens, "temperature": temperature, "topP": top_p, "topK": top_k},
    }
    if system:
        payload["system"] = [{"text": s.get("text", "") if isinstance(s, dict) else str(s)} for s in system]
    return payload


def _normalize_converse(resp: Any) -> str:
    try:
        parts = resp.get("output", {}).get("message", {}).get("content", [])
        if isinstance(parts, list):
            text = "".join(p.get("text", "") for p in parts if isinstance(p, dict))
            if text.strip():
                return text
    except Exception:
        pass
    return json.dumps(resp, ensure_ascii=False)


def _normalize_messages_v1(body: Any) -> str:
    try:
        out = body.get("output", [])
        if isinstance(out, list) and out:
            content = out[0].get("content", [])
            text = "".join(cb.get("text", "") for cb in content if isinstance(cb, dict))
            if text.strip():
                return text
    except Exception:
        pass
    return json.dumps(body, ensure_ascii=False)


def invoke_chat(
    *,
    messages: List[Dict[str, Any]],
    system: Optional[List[Dict[str, str]]] = None,
    model_id: Optional[str] = None,
    aws_region: Optional[str] = None,
    max_tokens: int = 500,
    temperature: float = 0.0,
    top_p: float = 0.9,
) -> str:
    """
    Unified chat:
      - Anthropic → Converse
      - Nova → messages-v1
    """
    mdl = model_id or DEFAULT_CLAUDE
    client = _client(aws_region)

    if _is_anthropic(mdl):
        params = _to_converse(messages, system, max_tokens=max_tokens, temperature=temperature, top_p=top_p)
        resp = client.converse(modelId=mdl, **params)
        return _normalize_converse(resp)

    payload = _to_messages_v1(messages, system, max_tokens=max_tokens, temperature=temperature, top_p=top_p)
    resp = client.invoke_model(
        modelId=mdl,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(payload),
    )
    body = json.loads(resp["body"].read())
    return _normalize_messages_v1(body)


def embed_text(text: str, *, model_id: Optional[str] = None, aws_region: Optional[str] = None) -> List[float]:
    """
    Titan v2 embeddings (text) — returns a vector list.
    """
    mdl = model_id or EMBEDDING_MODEL
    client = _client(aws_region)
    resp = client.invoke_model(
        modelId=mdl,
        contentType="application/json",
        accept="application/json",
        body=json.dumps({"inputText": text}),
    )
    data = json.loads(resp["body"].read())

    if "embedding" in data and isinstance(data["embedding"], dict) and "values" in data["embedding"]:
        return data["embedding"]["values"]
    if "embedding" in data and isinstance(data["embedding"], list):
        return data["embedding"]
    if "embeddings" in data and data["embeddings"]:
        first = data["embeddings"][0]
        if isinstance(first, dict) and "values" in first:
            return first["values"]
        if isinstance(first, list):
            return first
    raise RuntimeError(f"Unexpected embedding response shape: {data}")
