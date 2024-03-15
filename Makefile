SYSTEMD_DIR := /etc/systemd/system

.PHONY: install uninstall

install:
	@ install -t $(SYSTEMD_DIR) -m 644 ./ai-pr-bot.service ./ai-pr-bot.timer
	@ systemctl daemon-reload
	@ echo 'Installation completed.'

uninstall:
	@ $(RM) $(SYSTEMD_DIR)/ai-pr-bot.service $(SYSTEMD_DIR)/ai-pr-bot.timer
	@ systemctl daemon-reload
	@ echo 'Uninstallation completed.'
