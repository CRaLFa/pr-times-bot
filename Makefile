SYSTEMD_DIR := /etc/systemd/system

.PHONY: install uninstall

install:
	@ install -t $(SYSTEMD_DIR) -m 644 ./ai-pr-bot.service ./ai-pr-bot.timer
	@ systemctl daemon-reload
	@ systemctl enable --now biz-alliance-bot.timer
	@ echo 'Installation completed.'

uninstall:
	@ systemctl disable --now biz-alliance-bot.timer
	@ $(RM) $(SYSTEMD_DIR)/ai-pr-bot.service $(SYSTEMD_DIR)/ai-pr-bot.timer
	@ systemctl daemon-reload
	@ echo 'Uninstallation completed.'
