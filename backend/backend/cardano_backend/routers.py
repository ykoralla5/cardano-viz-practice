class CardanoDBRouter:
    route_app_labels = ['api']

    def _is_cardano_model(self, model):
        return model._meta.app_label in self.route_app_labels

    def db_for_read(self, model, **hints):
        # If 
        if self._is_cardano_model(model):
            return 'cardano'
        return None # Choose default DB
    
    def db_for_write(self, model, **hints):
        if self._is_cardano_model(model):
            return None
        return 'default'
    
    def allow_migrations(self, db, app_label, model_name=None, **hints):
        if app_label in self.route_app_labels:
            return False
        return db == "default"
    
    ## TODO: def allow_relation

