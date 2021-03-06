const should = require('should/as-function');

const FieldOperand = require('../../lib/engine/objects/fieldOperand');
const { Koncorde } = require('../../');

describe('Koncorde.keyword.geoPolygon', () => {
  let koncorde;
  let engine;
  let standardize;
  const polygon = {
    points: [
      { lat: 43.6021299, lon: 3.8989713 },
      { lat: 43.6057389, lon: 3.8968173 },
      { lat: 43.6092889, lon: 3.8970423 },
      { lat: 43.6100359, lon: 3.9040853 },
      { lat: 43.6069619, lon: 3.9170343 },
      { lat: 43.6076479, lon: 3.9230133 },
      { lat: 43.6038779, lon: 3.9239153 },
      { lat: 43.6019189, lon: 3.9152403 },
      { lat: 43.6036049, lon: 3.9092313 },
    ]
  };
  const polygonStandardized = {
    geospatial: {
      geoPolygon: {
        foo: [
          [ 43.6021299, 3.8989713 ],
          [ 43.6057389, 3.8968173 ],
          [ 43.6092889, 3.8970423 ],
          [ 43.6100359, 3.9040853 ],
          [ 43.6069619, 3.9170343 ],
          [ 43.6076479, 3.9230133 ],
          [ 43.6038779, 3.9239153 ],
          [ 43.6019189, 3.9152403 ],
          [ 43.6036049, 3.9092313 ],
        ]
      }
    }
  };

  beforeEach(() => {
    koncorde = new Koncorde();
    engine = koncorde.engines.get(null);
    standardize = koncorde.transformer.standardizer.standardize.bind(koncorde.transformer.standardizer);
  });

  describe('#validation/standardization', () => {
    it('should reject an empty filter', () => {
      should(() => standardize({geoPolygon: {}}))
        .throw({
          keyword: 'geoPolygon',
          message: '"geoPolygon": expected object to have exactly 1 property, got 0',
          path: 'geoPolygon',
        });
    });

    it('should reject a filter with multiple field attributes', () => {
      should(() => standardize({geoPolygon: {foo: polygon, bar: polygon}}))
        .throw({
          keyword: 'geoPolygon',
          message: '"geoPolygon": expected object to have exactly 1 property, got 2',
          path: 'geoPolygon',
        });
    });

    it('should reject a filter without a points field', () => {
      const filter = {foo: {bar: [[0, 0], [5, 5], [5, 0]]}};

      should(() => standardize({geoPolygon: filter}))
        .throw({
          keyword: 'geoPolygon',
          message: '"geoPolygon.foo": the property "points" is missing',
          path: 'geoPolygon.foo',
        });
    });

    it('should reject a filter with an empty points field', () => {
      should(() => standardize({geoPolygon: {foo: {points: []}}}))
        .throw({
          keyword: 'geoPolygon',
          message: '"geoPolygon.foo.points": at least 3 points are required to build a polygon',
          path: 'geoPolygon.foo.points',
        });
    });

    it('should reject a polygon with less than 3 points defined', () => {
      should(() => standardize({geoPolygon: {foo: {points: [[0, 0], [5, 5]]}}}))
        .throw({
          keyword: 'geoPolygon',
          message: '"geoPolygon.foo.points": at least 3 points are required to build a polygon',
          path: 'geoPolygon.foo.points',
        });
    });

    it('should reject a polygon with a non-array points field', () => {
      should(() => standardize({geoPolygon: {foo: {points: 'foobar'}}}))
        .throw({
          keyword: 'geoPolygon',
          message: '"geoPolygon.foo.points": must be an array',
          path: 'geoPolygon.foo.points',
        });
    });

    it('should reject a polygon containing an invalid point format', () => {
      const p = polygon.points.slice();
      p.push(42);
      should(() => standardize({geoPolygon: {foo: {points: p}}}))
        .throw({
          keyword: 'geoPolygon',
          message: '"geoPolygon.foo.points": unrecognized point format "42"',
          path: 'geoPolygon.foo.points',
        });
    });

    it('should standardize all geopoint types in a single points array', () => {
      const points = {
        points: [
          {lat: 43.6021299, lon: 3.8989713},
          {latLon: [43.6057389, 3.8968173]},
          {latLon: {lat: 43.6092889, lon: 3.8970423}},
          {latLon: '43.6100359, 3.9040853'},
          {latLon: 'spfb14kkcwbk'},
          {lat_lon: [43.6076479, 3.9230133]},
          {lat_lon: {lat: 43.6038779, lon: 3.9239153}},
          {lat_lon: '43.6019189, 3.9152403'},
          {lat_lon: 'spfb0cy97tn4'}
        ]
      };

      const result = standardize({geoPolygon: {foo: points}});
      should(result.geospatial).be.an.Object();
      should(result.geospatial.geoPolygon).be.an.Object();
      should(result.geospatial.geoPolygon.foo).be.an.Object();

      result.geospatial.geoPolygon.foo.forEach((p, i) => {
        should(p[0]).be.approximately(polygonStandardized.geospatial.geoPolygon.foo[i][0], 10e-6);
        should(p[1]).be.approximately(polygonStandardized.geospatial.geoPolygon.foo[i][1], 10e-6);
      });
    });
  });

  describe('#storage', () => {
    it('should store a single geoPolygon correctly', () => {
      const id = koncorde.register({ geoPolygon: { foo: polygon } });

      const subfilter = Array.from(engine.filters.get(id).subfilters)[0];
      const storage = engine.foPairs.get('geospatial');

      should(storage).be.instanceOf(FieldOperand);
      should(storage.fields.get('foo').get(Array.from(subfilter.conditions)[0].id))
        .match(new Set([subfilter]));
    });

    it('should add a subfilter to an already existing condition', () => {
      const id1 = koncorde.register({ geoPolygon: { foo: polygon } });
      const id2 = koncorde.register({
        and: [
          { geoPolygon: { foo: polygon } },
          { equals: { foo: 'bar' } },
        ],
      });

      const sf1 = Array.from(engine.filters.get(id1).subfilters)[0];
      const sf2 = Array.from(engine.filters.get(id2).subfilters)[0];
      const storage = engine.foPairs.get('geospatial');

      should(storage).be.instanceOf(FieldOperand);
      should(storage.fields.get('foo').get(Array.from(sf1.conditions)[0].id))
        .match(new Set([sf1, sf2]));
    });

    it('should add another condition to an already existing field', () => {
      const id1 = koncorde.register({ geoPolygon: { foo: polygon } });
      const id2 = koncorde.register({
        geoBoundingBox: {
          foo: {
            bottomRight: 'drj7teegpus6',
            topLeft: 'dr5r9ydj2y73',
          },
        },
      });

      const sf1 = Array.from(engine.filters.get(id1).subfilters)[0];
      const cond1 = Array.from(sf1.conditions)[0].id;
      const sf2 = Array.from(engine.filters.get(id2).subfilters)[0];
      const storage = engine.foPairs.get('geospatial');

      should(storage).be.instanceOf(FieldOperand);
      should(storage.fields.get('foo').get(cond1)).match(new Set([sf1]));
      should(storage.fields.get('foo').get(Array.from(sf2.conditions)[0].id))
        .match(new Set([sf2]));
    });
  });

  describe('#matching', () => {
    it('should match a point inside the polygon', () => {
      const id = koncorde.register({ geoPolygon: { foo: polygon } });

      const result = koncorde.test({
        foo: {
          latLon: [ 43.6073913, 3.9109057 ],
        },
      });

      should(result).eql([id]);
    });

    it('should match a point exactly on a polygon corner', () => {
      const id = koncorde.register({ geoPolygon: { foo: polygon } });

      const result = koncorde.test({ foo: { latLon: polygon.points[0] } });

      should(result).eql([id]);
    });

    it('should not match if a point is outside the bbox', () => {
      koncorde.register({ geoPolygon: { foo: polygon } });
      const result = koncorde.test({
        foo: {
          lat: polygon.points[0][0] + 10e-6,
          lon: polygon.points[0][1] + 10e-6,
        },
      });

      should(result).be.an.Array().and.be.empty();
    });

    it('should return an empty array if the document does not contain a geopoint', () => {
      koncorde.register({ geoPolygon: { foo: polygon } });

      const result = koncorde.test({ bar: { latLon: polygon.points[0] } });

      should(result).be.an.Array().and.be.empty();
    });

    it('should return an empty array if the document contain an invalid geopoint', () => {
      koncorde.register({ geoPolygon: { foo: polygon } });

      const result = koncorde.test({ foo: '43.6331979 / 3.8433703' });

      should(result).be.an.Array().and.be.empty();
    });
  });
});
