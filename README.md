# Excalidraw Smart Presentation

Create presentations with smart animations using Excalidraw

https://github.com/user-attachments/assets/62033fca-03ca-489f-aeeb-5d51331deac9

Presentation source available in `./presentation-docs`

## How to use

- Create frames using the frame tool. It can be brought up using the `f` keyboard shortcut, from the command palette or from the toolbar.
- Each frame represents a slide.
- Slides are ordered according to the frames' positions on the y-axis.
- Elements that are duplicated from one frame to the other are animated (can be customized as described below).
- Click "present" and use the arrow keys to move through the slides.

## Tips

- You can start the presentation at a certain slide by selecting the corresponding frame and clicking "present".
- If you want to ensure a 16:9 aspect ratio, edit the frame's size using the "Canvas & Shape Properties" menu which can be brought up from the command palette or by using the `alt` + `/` keyboard shortcut.
- If you want to duplicate an element from a frame to the exact same position in the next frame, select the element and press `ctrl` + `shift` + `d`, or select "duplicate into next frame" from the command palette.
- Wrong elements being animated? Elements unintentionally animated? Change the elements' names through the "Canvas & Shape Properties" menu. Elements with the same name are the ones that are animated from one frame to the other, but there can be unexpected behaviors when multiple elements with the same name are in the same frame, so you have the ability to edit the name.
