class DBRouter:
    route_app_labels = []

    def db_for_read(self, model, **hints):
        if model._meta.app_label == '':
            return 'cardano_db_filtered'
        return None 