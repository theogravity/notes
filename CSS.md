# CSS Triangles with box-shadow

Essentially a square with defined borders rotated 45 degrees.

Modified from:
http://codepen.io/ryanmcnz/pen/JDLhu

```css
/* Stylus Syntax */
$TriangleSize = 0.5em;
$BGColor = black;

.content {
    background: white;
    color: white;
    position: relative;
    box-sizing: border-box;
    box-shadow:  0px 2px 4px 2px rgba(0,0,0,0.25);

    &::after {
      content: "";
      position: absolute;
      width: 0;
      height: 0;
      margin-left: -0.6em;
      /* This vertically aligns the triangle */
      bottom: -0.78em;
      right: 5%;
      box-sizing: border-box;

      border: $TriangleSize solid $BGColor;
      border-color: transparent transparent $BGColor $BGColor;

      transform-origin: 0 0;
      
      /* Remove scale() if you want to make an equilateral triangle */
      transform: scale(.85, 1.6) rotate(-45deg);

      /* the -2px attempts to 'center' the shadow around the rectangle */
      box-shadow: -2px 2px 2px 0 rgba(0,0,0,0.25);
      
      /* Remove if you want your triangle to be pointy */
      border-radius: 4px;
      
      /* This is here to remove the artifacting of the shadows on the upper half of the rectangle */
      clip-path: inset(16% 16% 0 0);
    }
```
