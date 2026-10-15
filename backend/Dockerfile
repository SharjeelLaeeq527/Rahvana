# syntax=docker/dockerfile:1

########################  BASE  ########################
# Use Python 3.12 to match the local environment and satisfy
# the project's Python version requirement.
FROM python:3.12-slim-bookworm AS base
ARG TARGETARCH

# Keep the build non-interactive and Python output unbuffered.
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system libraries required by MediaPipe, OpenCV,
# ONNX Runtime, and image processing.
# curl and CA certificates are used when downloading model weights.
# Font packages support text rendering in image processing tasks.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgles2 \
        libgl1 \
        libegl1 \
        libglib2.0-0 \
        libgomp1 \
        libatomic1 \
        libfontconfig1 \
        fonts-liberation \
        ca-certificates \
        curl \
    && rm -rf /var/lib/apt/lists/*

########################  UV INSTALLER  ####################
# Install uv from its official image using a pinned version.
COPY --from=ghcr.io/astral-sh/uv:0.13.0 /uv /uvx /bin/

########################  DEPS (cached)  ###################
WORKDIR /app

# Copy dependency files separately to keep this layer cached
# when only application code changes.
COPY pyproject.toml uv.lock ./

# Install the locked production dependencies without installing
# the project itself. The application runs directly from source.
# Skip development dependencies such as pytest and watchfiles.
# Copy files instead of using hardlinks across filesystems.
ENV UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never
RUN uv sync --frozen --no-dev --no-install-project

########################  APP CODE  ########################
# Copy the application code and required assets.
# Secrets, the local virtual environment, and Git files are
# excluded through .dockerignore.
COPY . /app

# Download the rembg u2netp model during the build so it is
# available when the container starts. This avoids downloading
# the weights on the first request when running on Render.
# The model is stored in /app/.u2net, as expected by remove_bg.py.
RUN /app/.venv/bin/python -c "import os; os.environ['U2NET_HOME']='/app/.u2net'; from rembg.session_factory import new_session; new_session('u2netp')" && \
    mkdir -p /app/.u2net

########################  RUNTIME  #########################
# Use the virtual environment created by uv.
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1

# Render uses port 10000 by default.
EXPOSE 10000

# Check the health endpoint periodically while the container runs.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:${PORT:-10000}/health || exit 1

# Start the FastAPI application and listen on the port provided
# by the environment, falling back to 10000 for local runs.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]
