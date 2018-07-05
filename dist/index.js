'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = createPlugin;

var _mobx = require('mobx');

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _kindOf = require('kind-of');

var _kindOf2 = _interopRequireDefault(_kindOf);

var _isDataDescriptor = require('is-data-descriptor');

var _isDataDescriptor2 = _interopRequireDefault(_isDataDescriptor);

var _isAccessorDescriptor = require('is-accessor-descriptor');

var _isAccessorDescriptor2 = _interopRequireDefault(_isAccessorDescriptor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isDescriptor = function isDescriptor(value) {
  if ((0, _kindOf2.default)(value) !== 'object') {
    return false;
  }
  if ('get' in value) {
    return (0, _isAccessorDescriptor2.default)(value);
  }
  return (0, _isDataDescriptor2.default)(value);
};

var isUndefined = function isUndefined(value) {
  return typeof value === 'undefined';
};
var isFunction = function isFunction(value) {
  return typeof value === 'function';
};

function createPlugin(logrocket) {
  if (isUndefined(logrocket)) {
    throw new Error('Missing logrocket instance. Be sure you are passing LogRocket into logrocket-mobx.');
  }

  var observeProperty = function observeProperty(target, property) {
    var sanitizer = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function (event) {
      return event;
    };

    (0, _invariant2.default)((0, _mobx.isObservable)(target), 'Target must be observable');
    (0, _invariant2.default)(isFunction(sanitizer) || isUndefined(sanitizer), 'sanitizer property must be a function, was given a ' + (typeof sanitizer === 'undefined' ? 'undefined' : _typeof(sanitizer)));

    (0, _mobx.observe)(target, property, function (change) {
      // if we have an observer name, add it
      if (!isUndefined(change.object.name)) {
        change.observerName = change.object.name;
      }

      // remove the observable property because it can't be sanitized
      delete change.object;

      var sanitized = sanitizer(change);
      if (sanitized) {
        logrocket.log('change', sanitized);
      }
    });
  };

  var decorate = function decorate(props, sanitizer) {
    var _props = _slicedToArray(props, 3),
        instance = _props[0],
        property = _props[1],
        descriptor = _props[2];

    // the property won't exist until mobx adds it when its needed
    // so let's wait until it is by adding a callback to __mobxLazyInitializers
    // see mobx-decorators for examples of this


    instance.__mobxLazyInitializers = (instance.__mobxLazyInitializers || []).slice();
    instance.__mobxLazyInitializers.push(function (instance) {
      observeProperty(instance, property, sanitizer);
    });

    descriptor.configurable = true;
    return descriptor;
  };

  return {
    logObservable: function logObservable() {
      for (var _len = arguments.length, props = Array(_len), _key = 0; _key < _len; _key++) {
        props[_key] = arguments[_key];
      }

      if (isDescriptor(props[props.length - 1])) {
        // used as a decorator
        decorate(props);
      } else if (isFunction(props[0])) {
        // used as a decorator factory
        var sanitizer = props[0];
        return function () {
          for (var _len2 = arguments.length, props = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            props[_key2] = arguments[_key2];
          }

          return decorate(props, sanitizer);
        };
      } else if (!isUndefined(props[0])) {
        // used as a function
        var target = props[0];
        var _sanitizer = props[1];
        observeProperty(target, undefined, _sanitizer);
      }
    }
  };
}
module.exports = exports['default'];