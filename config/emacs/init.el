;;UI
(menu-bar-mode 1);enable/disable menu bar
(tool-bar-mode 0);enable/disable tool bar
(scroll-bar-mode 0);enable/disable scroll bar

;;Font and Theme
(set-face-attribute 'default nil :font "IosevkaTerm Nerd Font" :height 240)
(load-theme 'gruber-darker t)

;;Line numbers
(global-display-line-numbers-mode 1);Display line numbers

;;DEFAULTS
(setq-default inhibit-startup-message t ;inhibit startup message
  tab-width 2 ;tab width to 2
  indent-tabs-mode nil ;spaces instead of tabs
  display-line-numbers-type 'relative ;relative line numbers
)

;; Search match counter
(setq isearch-lazy-count t)
(setq lazy-count-prefix-format "(%s/%s) ")
(setq lazy-count-suffix-format nil)

;; Make regular Isearch interpret the empty space as a Regexp
;; To match every char between the words you give it
(setq search-whitespace-regexp ".*?")

;;IDO (Interactive Do)
;For autocompletion on C-x C-f and such
(ido-mode 1)
(ido-everywhere 1)

;;TODO
;;smex(ido on M-x)
;;multiple cursors
;;a way to download packages automatically (gruber-darker)

;;ORG-MODE
(custom-set-variables
 ;; custom-set-variables was added by Custom.
 ;; If you edit it by hand, you could mess it up, so be careful.
 ;; Your init file should contain only one such instance.
 ;; If there is more than one, they won't work right.
 '(package-selected-packages
   '(dockerfile-mode gruber-darker-theme lua-mode rust-mode yaml
                     yaml-mode)))
(custom-set-faces
 ;; custom-set-faces was added by Custom.
 ;; If you edit it by hand, you could mess it up, so be careful.
 ;; Your init file should contain only one such instance.
 ;; If there is more than one, they won't work right.
 )
