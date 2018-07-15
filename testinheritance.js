function Shape() {
};
Shape.prototype.hello = function() {
    return "Hello "+this.getName();
};
Shape.prototype.getName = function() {
    return "Shape";
};
Shape.prototype.getArea = function() {
    throw "Virtual function";
};

function Circle() {
};
Circle.prototype = new Shape();
Circle.prototype.getName = function() {
    return "Circle";
};
Circle.prototype.getArea = function() {
    return 2.0;
};

function Rectangle() {
};
Rectangle.prototype = new Shape();
Rectangle.prototype.getName = function() {
    return "Rectangle";
};
Rectangle.prototype.getArea = function() {
    return 3.0;
};

function Square() {
};
Square.prototype = new Rectangle();
Square.prototype.getName = function() {
    return "Square";
};
Square.prototype.getArea = function() {
    return 1.0;
};

require('util').log("1: "+(new Shape()).hello());
require('util').log("2: "+(new Circle()).hello());
require('util').log("3: "+(new Circle()).getArea());
require('util').log("4: "+(new Rectangle()).getArea());
require('util').log("5: "+(new Square()).getArea());
require('util').log("6: "+(new Square()).hello());
