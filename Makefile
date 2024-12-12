SYSTEMD_DIR := /etc/systemd/system

.PHONY: install uninstall

install:
	@ install -t $(SYSTEMD_DIR) -m 644 ./pr-times-bot.service
	@ systemctl daemon-reload
	@ systemctl enable --now pr-times-bot.service
	@ echo 'Installation completed.'

uninstall:
	@ systemctl disable --now pr-times-bot.service
	@ $(RM) $(SYSTEMD_DIR)/pr-times-bot.service
	@ systemctl daemon-reload
	@ echo 'Uninstallation completed.'
