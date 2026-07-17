from PIL import Image, ImageDraw

# Open the original logo
orig_path = "/Users/joaolucas/.gemini/antigravity/brain/1ff59cb6-da07-448e-ba51-7500b7049493/.user_uploaded/media__1784328572857.png"
logo = Image.open(orig_path).convert("RGBA")

# Resize logo to Apple's squircle grid size (824x824)
logo_resized = logo.resize((824, 824), Image.Resampling.LANCZOS)

# Create a rounded rectangle mask
mask = Image.new("L", (824, 824), 0)
draw = ImageDraw.Draw(mask)
# Apple Big Sur specification: corner radius = 204px for 824px icon width
draw.rounded_rectangle([(0, 0), (824, 824)], radius=204, fill=255)

# Apply mask to the logo
logo_masked = Image.new("RGBA", (824, 824))
logo_masked.paste(logo_resized, (0, 0), mask=mask)

# Create final 1024x1024 transparent canvas
canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
# Center the masked logo (100px padding all around)
canvas.paste(logo_masked, (100, 100))

# Save output
canvas.save("/Users/joaolucas/Desktop/Catarse App/rounded_logo.png", "PNG")
print("Apple-compliant squircle icon generated at rounded_logo.png")
