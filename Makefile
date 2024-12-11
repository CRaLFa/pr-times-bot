SYSTEMD_DIR := /etc/systemd/system

.PHONY: install uninstall

install:
	@ install -t $(SYSTEMD_DIR) -m 644 ./ai-pr-bot.service
	@ systemctl daemon-reload
	@ systemctl enable --now ai-pr-bot.service
	@ echo 'Installation completed.'

uninstall:
	@ systemctl disable --now ai-pr-bot.service
	@ $(RM) $(SYSTEMD_DIR)/ai-pr-bot.service
	@ systemctl daemon-reload
	@ echo 'Uninstallation completed.'
