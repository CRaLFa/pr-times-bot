SYSTEMD_DIR := /etc/systemd/system

.PHONY: install

install:
	@ install -t $(SYSTEMD_DIR) -m 644 ./ai-pr-bot.service ./ai-pr-bot.timer
	@ sudo systemctl daemon-reload
	@ echo 'Installation completed.'
