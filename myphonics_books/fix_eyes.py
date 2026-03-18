import cv2
import numpy as np

img = cv2.imread("output/images/L4_3_B1/page6.png")
if img is None:
    print("Image not found")
    exit()

# Find black connected components (the eyes might be black blobs with white inside)
# Or find white pixels that are surrounded by black.
# Actually, it's easier to find white highlights and check if they are very small and inside black blobs.

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Threshold to find very dark regions (black)
_, black_mask = cv2.threshold(gray, 50, 255, cv2.THRESH_BINARY_INV)

# Find white regions (highlights)
_, white_mask = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)

# Dilate black mask to find regions near black
kernel = np.ones((5,5), np.uint8)
black_dilated = cv2.dilate(black_mask, kernel, iterations=2)

# Intersect white mask with dilated black mask
# This gives white pixels that are near or inside black pixels
highlights_near_black = cv2.bitwise_and(white_mask, black_dilated)

# Find contours of these highlights
contours, _ = cv2.findContours(highlights_near_black, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

count = 0
for contour in contours:
    # Filter by size (highlights are small)
    area = cv2.contourArea(contour)
    if 0 < area < 50:  # Adjust max area as needed
        # Fill it with black
        cv2.drawContours(img, [contour], -1, (0, 0, 0), thickness=cv2.FILLED)
        
        # Also dilate the draw slightly to be safe
        cv2.drawContours(img, [contour], -1, (0, 0, 0), thickness=2)
        count += 1

print(f"Filled {count} white highlights inside/near black areas.")
cv2.imwrite("output/images/L4_3_B1/page6_fixed.png", img)
