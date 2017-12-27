/**
 * Copyright (c) 2014, 2017, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your application specific code will go here
 */
define(['ojs/ojcore', 'knockout', 'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojarraytabledatasource',
  'ojs/ojoffcanvas', 'ojs/ojbutton', 'ojs/ojmenu', 'ojs/ojoption', 'ojs/ojnavigationlist', 'ojs/ojconveyorbelt'],
  function(oj, ko) {
     function ControllerViewModel() {
       var self = this;

      // Media queries for repsonsive layouts
      var smQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
      self.smScreen = oj.ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
      var mdQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.MD_UP);
      self.mdScreen = oj.ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);

       // Router setup
       self.router = oj.Router.rootInstance;
       self.router.configure({
         'dashboard': {label: 'Dashboard', isDefault: true},
         'incidents': {label: 'Incidents'},
         'customers': {label: 'Customers'},
         'about': {label: 'About'}
       });
      oj.Router.defaults['urlAdapter'] = new oj.Router.urlParamAdapter();

      // Navigation setup
      var navData = [
      {name: 'Dashboard', id: 'dashboard',
       iconClass: 'oj-navigationlist-item-icon demo-icon-font-24 demo-chart-icon-24'},
      {name: 'Incidents', id: 'incidents',
       iconClass: 'oj-navigationlist-item-icon demo-icon-font-24 demo-fire-icon-24'},
      {name: 'Customers', id: 'customers',
       iconClass: 'oj-navigationlist-item-icon demo-icon-font-24 demo-people-icon-24'},
      {name: 'About', id: 'about',
       iconClass: 'oj-navigationlist-item-icon demo-icon-font-24 demo-info-icon-24'}
      ];
      self.navDataSource = new oj.ArrayTableDataSource(navData, {idAttribute: 'id'});

      // array of dynamic tabs
      self.menuShortcuts = ko.observableArray();
      self.menuShortcutsDataSource = new oj.ArrayTableDataSource(self.menuShortcuts, {idAttribute: 'id'});
      // add default tab
      self.menuShortcuts.push({name: 'Dashboard', id: 'dashboard'});
      // current tab
      self.selectedItem = ko.observable('dashboard');
      // next tab to focus after current tab remove
      var tabToFocusAfterRemove = '';

      // Drawer
      // Close offcanvas on medium and larger screens
      self.mdScreen.subscribe(function() {oj.OffcanvasUtils.close(self.drawerParams);});
      self.drawerParams = {
        displayMode: 'push',
        selector: '#navDrawer',
        content: '#pageContent'
      };
      // Called by navigation drawer toggle button and after selection of nav drawer item
      self.toggleDrawer = function() {
        return oj.OffcanvasUtils.toggle(self.drawerParams);
      }
      // Add a close listener so we can move focus back to the toggle button when the drawer closes
      $("#navDrawer").on("ojclose", function() { $('#drawerToggleButton').focus(); });

      // Header
      // Application Name used in Branding Area
      self.appName = ko.observable("JET Dynamic Tabs Demo");
      // User Info used in Global Navigation area
      self.userLogin = ko.observable("andrejusb@redsamuraiconsulting.com");

      // handle click on the menu, used for small screen, when navigation list on the left
      self.menuSelection = ko.computed(function () {
        if (tabToFocusAfterRemove !== '') {
          return self.router.stateId();
        }

        var menuKey = self.router.stateId();
        if (menuKey !== undefined) {
          var menuExist = false;

          // avoid duplicates
          for (i = 0; i < self.menuShortcuts().length; i++) {
              if (menuKey === self.menuShortcuts()[i].id) {
                  menuExist = true;
                  break;
              }
          }

          if (menuExist === false) {
            // add new tab with ID and Name from menu
            for (i = 0; i < navData.length; i++) {
                if (menuKey === navData[i].id) {
                  self.menuShortcuts.push({id: navData[i].id, name: navData[i].name});
                  break;
                }
            }
          }

          // set current tab
          self.selectedItem(menuKey);
        }

        return self.router.stateId();
      });

      // handle module selection from the list and update list of tabs
      self.menuItemAction = function(event) {
        // if we are removing tab, no logic to process
        if (tabToFocusAfterRemove !== '') {
          return;
        }

        var menuKey = event.target.value;
        var menuExist = false;

        // avoid duplicates
        for (i = 0; i < self.menuShortcuts().length; i++) {
            if (menuKey === self.menuShortcuts()[i].id) {
                menuExist = true;
                break;
            }
        }

        if (menuExist === false) {
          // add new tab with ID and Name from menu
          for (i = 0; i < navData.length; i++) {
            if (menuKey === navData[i].id) {
              self.menuShortcuts.push({id: navData[i].id, name: navData[i].name});
              break;
            }
          }
        }

        // set current tab, make sure tab is set in Promis, to delay UI update
        self.router.go(menuKey).then (
          function(result) {
            self.selectedItem(menuKey);
          }
        );
      };

      // handle selection for dynamic tab
      self.selectedItem.subscribe(function (menuKey) {
        tabToFocusAfterRemove = '';

        self.router.go(menuKey).then (
          function(result) {}
        );
      });

      //handle tab removal
      this.onRemove = function (event) {
        self.delete(event.detail.key);

        event.preventDefault();
        event.stopPropagation();
      };

      self.delete = function(tabId) {
        var items = self.menuShortcuts();
        for (i = 0; i < items.length; i++) {
          if (tabId === items[i].id) {
            tabToFocusAfterRemove = self.router.stateId();

            // check where is focus - on tab to be removed or on another tab
            if (self.router.stateId() === tabId) {
              if (items[i+1] !== undefined) {
                tabToFocusAfterRemove = items[i+1].id;
              } else {
                tabToFocusAfterRemove = items[i-1].id;
              }
            }

            // remove tab
            self.menuShortcuts.splice(i, 1);

            // set current tab in router navigation promis, to delay UI update
            self.router.go(tabToFocusAfterRemove).then (
              function(result) {
                self.selectedItem(tabToFocusAfterRemove);

                // if focus remains on same tab, when another row is removed - reset variable for current focus
                if (self.selectedItem() === tabToFocusAfterRemove) {
                  tabToFocusAfterRemove =  '';
                }
              }
            );

            break;
          }
        }
      };

      // Footer
      function footerLink(name, id, linkTarget) {
        this.name = name;
        this.linkId = id;
        this.linkTarget = linkTarget;
      }
      self.footerLinks = ko.observableArray([
        new footerLink('About Oracle', 'aboutOracle', 'http://www.oracle.com/us/corporate/index.html#menu-about'),
        new footerLink('Contact Us', 'contactUs', 'http://www.oracle.com/us/corporate/contact/index.html'),
        new footerLink('Legal Notices', 'legalNotices', 'http://www.oracle.com/us/legal/index.html'),
        new footerLink('Terms Of Use', 'termsOfUse', 'http://www.oracle.com/us/legal/terms/index.html'),
        new footerLink('Your Privacy Rights', 'yourPrivacyRights', 'http://www.oracle.com/us/legal/privacy/index.html')
      ]);
     }

     return new ControllerViewModel();
  }
);
