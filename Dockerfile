FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    curl nano jq

# 👇 ADD THIS
RUN useradd -m pramaan

WORKDIR /app

COPY pramaand /usr/local/bin/pramaand
RUN chmod +x /usr/local/bin/pramaand

# 👇 ADD THIS
USER pramaan

CMD ["pramaand", "start", "--home", "/app/.pramaand", "--minimum-gas-prices=0.0000001stake"]