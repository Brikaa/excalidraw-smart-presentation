# Excalidraw Smart Presentation

Create dynamic, animated presentations directly within Excalidraw.

This tool allows you to define **frames** as slides, automatically animating elements that persist between frames. It enables seamless transitions and a structured way to present ideas visually.

https://github.com/user-attachments/assets/62033fca-03ca-489f-aeeb-5d51331deac9

**Presentation source:** Available in [`./presentation-docs`](./presentation-docs).

## How to Use

1. **Create Frames:**

   - Use the **Frame tool** (`f` key, toolbar, or command palette).
   - Each frame represents a slide.

2. **Define Slide Order:**

   - Frames are ordered based on their **y-axis position**.

3. **Animations:**

   - Elements that are duplicated from one frame to the other are animated on slide transition by interpolating the changes in their properties.
   - This behavior can be customized (see below).

4. **Present Your Slides:**

   - Click **"Present"** in the bottom-right corner (also accessible via the command palette or menu).
   - Navigate using `→` / `←` arrow keys, or click the sides of the presentation.

## Tips & Tricks

- **Start from a Specific Slide:**

  - Select a frame, then click **"Present"**.

- **Maintain a 16:9 Aspect Ratio or any exact size:**

  - Edit frame size via **"Canvas & Shape Properties"** (`Alt + /` or command palette).

- **Duplicate an element into the exact same position in the next frame:**

  - Select an element, then press **`Ctrl + Shift + D`**
  - Or use **"Duplicate into next frame"** from the command palette.

- **Fix Unintended Animations:**

  - Elements with the **same name** in consecutive frames are animated.
  - Elements are given the same name on duplication, hence why duplicated elements are animated.
  - Rename elements in **"Canvas & Shape Properties"** to prevent unwanted animations or to animate different elements.

## Current Limitations

- Animation duration (300 ms) and type (linear) are not customizable.
- Can't create shareable links
