class MitutoyoRule:
    def __init__(self, engine):
        self.engine = engine

    def evaluate(self, spec, values, context):       
        return self.engine._analyze_stable_average(spec, values)