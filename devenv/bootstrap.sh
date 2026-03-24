#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# Bootstrap — One-time machine setup for Automate E2E
# Run: bash ~/development/local-setup/scripts/bootstrap.sh
# Requires: sudo access, GitHub SSH key configured
# ═══════════════════════════════════════════════════════════════

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[SETUP]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC}    $1"; }
warn() { echo -e "${YELLOW}[SKIP]${NC}  $1"; }

DEV="$HOME/development"

echo ""
echo "============================================"
echo "  Automate E2E — Machine Bootstrap"
echo "============================================"
echo ""

# ─── Homebrew ─────────────────────────────────────────────────

if command -v brew &>/dev/null; then
  ok "Homebrew installed"
else
  log "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# ─── RVM + Ruby ──────────────────────────────────────────────

if command -v rvm &>/dev/null; then
  ok "rvm installed"
else
  log "Installing rvm..."
  curl -sSL https://get.rvm.io | bash -s stable
  source "$HOME/.rvm/scripts/rvm"
fi

if rvm list strings | grep -q "ruby-2.6.6"; then
  ok "Ruby 2.6.6 installed"
else
  log "Installing Ruby 2.6.6..."
  rvm install 2.6.6
fi

if rvm gemset list | grep -q "rails602"; then
  ok "rails602 gemset exists"
else
  log "Creating rails602 gemset..."
  rvm use 2.6.6
  rvm gemset create rails602
fi

# ─── NVM + Node versions ────────────────────────────────────

export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  source "$NVM_DIR/nvm.sh"
  ok "nvm installed"
else
  log "Installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  source "$NVM_DIR/nvm.sh"
fi

for version in 16.20.2 18.12.1 20.17.0 22.15.0; do
  if [ -d "$NVM_DIR/versions/node/v$version" ]; then
    ok "Node v$version installed"
  else
    log "Installing Node v$version..."
    nvm install "$version"
  fi
done

nvm alias default 20.17.0

# ─── Databases + Infrastructure ──────────────────────────────

for pkg in mysql redis postgresql@14; do
  if brew list "$pkg" &>/dev/null; then
    ok "$pkg installed"
  else
    log "Installing $pkg..."
    brew install "$pkg"
  fi
done

# Start services
for svc in mysql redis postgresql@14; do
  if brew services list | grep "$svc" | grep -q started; then
    ok "$svc running"
  else
    log "Starting $svc..."
    brew services start "$svc"
  fi
done

# ─── Elasticsearch 6.8.18 ───────────────────────────────────

ES_DIR="$DEV/elasticsearch/elasticsearch-6.8.18"
if [ -d "$ES_DIR" ]; then
  ok "Elasticsearch 6.8.18 installed"
else
  log "Downloading Elasticsearch 6.8.18..."
  mkdir -p "$DEV/elasticsearch"
  cd "$DEV/elasticsearch"
  curl -O "https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-6.8.18-darwin-x86_64.tar.gz"
  tar -xzf elasticsearch-6.8.18-darwin-x86_64.tar.gz
  rm elasticsearch-6.8.18-darwin-x86_64.tar.gz
  ok "Elasticsearch 6.8.18 installed"
fi

# ─── Kafka 2.12 ─────────────────────────────────────────────

KAFKA_DIR="$DEV/kafka/kafka_2.12-2.7.0"
if [ -d "$KAFKA_DIR" ]; then
  ok "Kafka 2.12-2.7.0 installed"
else
  log "Downloading Kafka 2.12-2.7.0..."
  mkdir -p "$DEV/kafka"
  cd "$DEV/kafka"
  curl -O "https://archive.apache.org/dist/kafka/2.7.0/kafka_2.12-2.7.0.tgz"
  tar -xzf kafka_2.12-2.7.0.tgz
  rm kafka_2.12-2.7.0.tgz
  ok "Kafka installed"
fi

# ─── Java 17 (for O11Y services) ────────────────────────────

if java -version 2>&1 | grep -q "17"; then
  ok "Java 17 installed"
else
  if command -v sdk &>/dev/null; then
    log "Installing Java 17 via SDKMAN..."
    sdk install java 17.0.4-tem
  else
    warn "Java 17 not found. Install via: brew install openjdk@17"
  fi
fi

# ─── Tilt ────────────────────────────────────────────────────

if command -v tilt &>/dev/null; then
  ok "Tilt installed ($(tilt version))"
else
  log "Installing Tilt..."
  brew install tilt
fi

# ─── /etc/hosts entries ─────────────────────────────────────

HOSTS_ENTRIES=(
  "127.0.0.1 local.bsstag.com"
  "127.0.0.1 automate-local.bsstag.com"
  "127.0.0.1 app-automate-local.bsstag.com"
  "127.0.0.1 live-local.bsstag.com"
  "127.0.0.1 app-live-local.bsstag.com"
  "127.0.0.1 accounts-local.bsstag.com"
  "127.0.0.1 api-local.bsstag.com"
  "127.0.0.1 observability-local.bsstag.com"
  "127.0.0.1 apidev.bsstag.com"
)

HOSTS_NEEDED=false
for entry in "${HOSTS_ENTRIES[@]}"; do
  if ! grep -q "$entry" /etc/hosts; then
    HOSTS_NEEDED=true
    break
  fi
done

if [ "$HOSTS_NEEDED" = true ]; then
  log "Adding /etc/hosts entries (needs sudo)..."
  for entry in "${HOSTS_ENTRIES[@]}"; do
    if ! grep -q "$entry" /etc/hosts; then
      echo "$entry" | sudo tee -a /etc/hosts > /dev/null
    fi
  done
  ok "/etc/hosts updated"
else
  ok "/etc/hosts entries present"
fi

# ─── nginx + Passenger ──────────────────────────────────────

if [ -f /opt/nginx/sbin/nginx ]; then
  ok "nginx + Passenger installed"
else
  warn "nginx + Passenger NOT installed at /opt/nginx"
  warn "Install manually: rvm use 2.6.6@rails602 && gem install passenger && passenger-install-nginx-module"
fi

# ─── Create development directory structure ──────────────────

mkdir -p "$DEV/local-setup/logs"

# ─── Summary ─────────────────────────────────────────────────

echo ""
echo "============================================"
echo "  Bootstrap Complete"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Configure nginx (if not installed): passenger-install-nginx-module"
echo "  2. Get SSL certs from Vault for *.bsstag.com"
echo "  3. cd ~/development && tilt up"
echo "  4. Open Tilt UI → click setup triggers for each repo"
echo "  5. Start railsapp: sudo /opt/nginx/sbin/nginx"
echo ""
