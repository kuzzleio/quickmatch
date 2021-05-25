const should = require('should/as-function');

const FieldOperand = require('../../lib/storage/objects/fieldOperand');
const DSL = require('../../');

describe('DSL.keyword.geoDistanceRange', () => {
  let dsl;
  let filters;
  let foPairs;
  let standardize;
  const point = { lat: 43.6331979, lon: 3.8433703 };
  const distanceStandardized = {
    geospatial: {
      geoDistanceRange: {
        foo: {
          lat: 43.6331979,
          lon: 3.8433703,
          from: 1000,
          to: 10000
        }
      }
    }
  };

  beforeEach(() => {
    dsl = new DSL();
    filters = dsl.storage.filters;
    foPairs = dsl.storage.foPairs;
    standardize = dsl.transformer.standardizer.standardize
      .bind(dsl.transformer.standardizer);
  });

  describe('#validation/standardization', () => {
    it('should reject an empty filter', () => {
      should(() => standardize({geoDistanceRange: {}}))
        .throw('"geoDistanceRange" must be a non-empty object');
    });

    it('should reject a filter with multiple field attributes', () => {
      const filter = {foo: point, bar: point, from: '1km', to: '10km'};

      should(() => standardize({geoDistanceRange: filter}))
        .throw('"geoDistanceRange" keyword must (only) contain a document field and the following attributes: "from", "to"');
    });

    it('should validate a {lat, lon} point', () => {
      const filter = {foo: point, from: '1km', to: '10km'};

      should(standardize({geoDistanceRange: filter}))
        .match(distanceStandardized);
    });

    it('should validate a {latLon: [lat, lon]} point', () => {
      const p = {latLon: [point.lat, point.lon]};

      should(standardize({geoDistanceRange: {foo: p, from: '1km', to: '10km'}}))
        .match(distanceStandardized);
    });

    it('should validate a {lat_lon: [lat, lon]} point', () => {
      const p = {lat_lon: [point.lat, point.lon]};

      should(standardize({geoDistanceRange: {foo: p, from: '1km', to: '10km'}}))
        .match(distanceStandardized);
    });

    it('should validate a {latLon: {lat: lat, lon: lon}} point', () => {
      const p = {latLon: {lat: point.lat, lon: point.lon}};

      should(standardize({geoDistanceRange: {foo: p, from: '1km', to: '10km'}}))
        .match(distanceStandardized);
    });

    it('should validate a {lat_lon: {lat: lat, lon: lon}} point', () => {
      const p = {lat_lon: {lat: point.lat, lon: point.lon}};

      should(standardize({geoDistanceRange: {foo: p, from: '1km', to: '10km'}}))
        .match(distanceStandardized);
    });

    it('should validate a {latLon: "lat, lon"} point', () => {
      const p = {latLon: `${point.lat}, ${point.lon}`};

      should(standardize({geoDistanceRange: {foo: p, from: '1km', to: '10km'}}))
        .match(distanceStandardized);
    });

    it('should validate a {lat_lon: "lat, lon"} point', () => {
      const p = {lat_lon: `${point.lat}, ${point.lon}`};

      should(standardize({geoDistanceRange: {foo: p, from: '1km', to: '10km'}}))
        .match(distanceStandardized);
    });

    it('should validate a {latLon: "geohash"} point', () => {
      const p = {latLon: 'spf8prntv18e'};

      const result = standardize({
        geoDistanceRange: {
          foo: p,
          from: '1km',
          to: '10km',
        }
      });

      should(result).be.an.Object();
      should(result.geospatial).be.an.Object();
      should(result.geospatial.geoDistanceRange).be.an.Object();
      should(result.geospatial.geoDistanceRange.foo).be.an.Object();
      should(result.geospatial.geoDistanceRange.foo.from).be.eql(1000);
      should(result.geospatial.geoDistanceRange.foo.to).be.eql(10000);

      should(result.geospatial.geoDistanceRange.foo.lat)
        .be.approximately(point.lat, 10e-7);

      should(result.geospatial.geoDistanceRange.foo.lon)
        .be.approximately(point.lon, 10e-7);
    });

    it('should validate a {lat_lon: "geohash"} point', () => {
      const p = {lat_lon: 'spf8prntv18e'};

      const result = standardize({
        geoDistanceRange: {
          foo: p,
          from: '1km',
          to: '10km',
        },
      });

      should(result).be.an.Object();
      should(result.geospatial).be.an.Object();
      should(result.geospatial.geoDistanceRange).be.an.Object();
      should(result.geospatial.geoDistanceRange.foo).be.an.Object();
      should(result.geospatial.geoDistanceRange.foo.from).be.eql(1000);
      should(result.geospatial.geoDistanceRange.foo.to).be.eql(10000);

      should(result.geospatial.geoDistanceRange.foo.lat)
        .be.approximately(point.lat, 10e-7);

      should(result.geospatial.geoDistanceRange.foo.lon)
        .be.approximately(point.lon, 10e-7);
    });

    it('should reject an unrecognized point format', () => {
      const p = {foo: 'bar'};
      const filter = {foo: p, from: '1km', to: '10km'};

      should(() => standardize({geoDistanceRange: filter}))
        .throw('geoDistanceRange.foo: unrecognized point format');
    });

    it('should reject an invalid latLon argument type', () => {
      const p = {latLon: 42};
      const filter = {foo: p, from: '1km', to: '10km'};

      should(() => standardize({geoDistanceRange: filter}))
        .throw('geoDistanceRange.foo: unrecognized point format');
    });

    it('should reject an invalid latLon argument string', () => {
      const p = {latLon: '[10, 10]'};
      const filter = {foo: p, from: '1km', to: '10km'};

      should(() => standardize({geoDistanceRange: filter}))
        .throw('geoDistanceRange.foo: unrecognized point format');
    });

    it('should reject a filter with a non-string from value', () => {
      const filter = {foo: point, from: 42, to: '10km'};

      should(() => standardize({geoDistanceRange: filter}))
        .throw('Attribute "from" in "geoDistanceRange" must be a string');
    });

    it('should reject a filter with a non-string to value', () => {
      const filter = {foo: point, from: '1km', to: 42};

      should(() => standardize({geoDistanceRange: filter}))
        .throw('Attribute "to" in "geoDistanceRange" must be a string');
    });

    it('should reject a filter with incorrect from value', () => {
      const filter = {foo: point, from: '1 micronanomillimeter', to: '1km'};

      should(() => standardize({geoDistanceRange: filter}))
        .throw('unable to parse distance value "1 micronanomillimeter"');
    });

    it('should reject a filter with incorrect to value', () => {
      const filter = {foo: point, from: '1 km', to: '1 ly'};

      should(() => standardize({geoDistanceRange: filter}))
        .throw('unable to parse distance value "1 ly"');
    });

    it('should reject a filter with a negative range', () => {
      const filter = {foo: point, from: '10 km', to: '1km'};

      should(() => standardize({geoDistanceRange: filter}))
        .throw('geoDistanceRange.foo: inner radius must be smaller than outer radius');
    });
  });

  describe('#storage', () => {
    it('should store a single geoDistanceRange correctly', () => {
      const sub = dsl.register('index', 'collection', {
        geoDistanceRange: {
          foo: point,
          from: '1km',
          to: '10km',
        },
      });

      const subfilter = Array.from(filters.get(sub.id).subfilters)[0];
      const storage = foPairs.get('index', 'collection', 'geospatial');

      should(storage).be.instanceOf(FieldOperand);
      should(storage.fields.get('foo').get(Array.from(subfilter.conditions)[0].id))
        .match(new Set([subfilter]));
    });

    it('should add a subfilter to an already existing condition', () => {
      const sub1 = dsl.register('index', 'collection', {
        geoDistanceRange: {
          foo: point,
          from: '1km',
          to: '10km',
        },
      });

      const sub2 = dsl.register('index', 'collection', {
        and: [
          { geoDistanceRange: { foo: point, from: '1km', to: '10km' } },
          { equals: { foo: 'bar' } },
        ],
      });

      const sf1 = Array.from(filters.get(sub1.id).subfilters)[0];
      const sf2 = Array.from(filters.get(sub2.id).subfilters)[0];
      const storage = foPairs.get('index', 'collection', 'geospatial');

      should(storage).be.instanceOf(FieldOperand);
      should(storage.fields.get('foo').get(Array.from(sf1.conditions)[0].id))
        .match(new Set([sf1, sf2]));
    });

    it('should add another condition to an already existing field', () => {
      const sub1 = dsl.register('index', 'collection', {
        geoDistanceRange: {
          foo: point,
          from: '1km',
          to: '10km',
        },
      });

      const sub2 = dsl.register('index', 'collection', {
        geoDistanceRange: {
          foo: point,
          from: '10km',
          to: '100km',
        },
      });

      const sf1 = Array.from(filters.get(sub1.id).subfilters)[0];
      const cond1 = Array.from(sf1.conditions)[0].id;
      const sf2 = Array.from(filters.get(sub2.id).subfilters)[0];
      const storage = foPairs.get('index', 'collection', 'geospatial');

      should(storage).be.instanceOf(FieldOperand);
      should(storage.fields.get('foo').get(cond1)).match(new Set([sf1]));
      should(storage.fields.get('foo').get(Array.from(sf2.conditions)[0].id))
        .match(new Set([sf2]));
    });
  });

  describe('#matching', () => {
    it('should match a point inside the circle', () => {
      const sub = dsl.register('index', 'collection', {
        geoDistanceRange: {
          foo: point,
          from: '1km',
          to: '10km',
        },
      });

      const result = dsl.test('index', 'collection', {
        foo: {
          lat: 43.634,
          lon: 3.9,
        },
      });

      should(result).eql([sub.id]);
    });

    it('should not match if a point is outside the outer radius', () => {
      dsl.register('index', 'collection', {
        geoDistanceRange: {
          foo: point,
          from: '1km',
          to: '10km',
        },
      });

      const result = dsl.test('index', 'collection', {
        foo: {
          lat: point.lat,
          lon: 5,
        },
      });

      should(result).be.an.Array().and.be.empty();
    });

    it('should not match if a point is inside the inner radius', () => {
      dsl.register('index', 'collection', {
        geoDistanceRange: {
          foo: point,
          from: '1km',
          to: '10km',
        },
      });

      const result = dsl.test('index', 'collection', {foo: point});

      should(result).be.an.Array().and.be.empty();
    });

    it('should return an empty array if the document does not contain the searched geopoint', () => {
      dsl.register('index', 'collection', {
        geoDistanceRange: {
          foo: point,
          from: '1km',
          to: '10km',
        },
      });

      const result = dsl.test('index', 'collection', {bar: point});

      should(result).be.an.Array().and.be.empty();
    });

    it('should return an empty array if the document contain an invalid geopoint', () => {
      dsl.register('index', 'collection', {
        geoDistanceRange: {
          foo: point,
          from: '1km',
          to: '10km',
        },
      });

      const result = dsl.test('index', 'collection', {
        foo: '43.6331979 / 3.8433703',
      });

      should(result).be.an.Array().and.be.empty();
    });
  });
});
