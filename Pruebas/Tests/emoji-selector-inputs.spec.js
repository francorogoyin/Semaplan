const { test, expect } = require("@playwright/test");

test("bloquea escritura y sugerencias en campos de emoji", async ({
  page
}) => {
  await page.goto("/index.html");
  await page.waitForSelector("#Selector_Emojis_Popover", {
    state: "attached"
  });

  await page.evaluate(() => {
    const input = document.createElement("input");
    input.id = "Emoji_Visible_Test";
    input.className = "Con_Selector_Emoji";
    input.value = "🎯";
    input.style.position = "fixed";
    input.style.left = "20px";
    input.style.top = "20px";
    input.style.zIndex = "99999";
    document.body.appendChild(input);
  });

  const input = page.locator("#Emoji_Visible_Test");
  await page.evaluate(() => {
    Abrir_Selector_Emojis(
      document.getElementById("Emoji_Visible_Test")
    );
  });
  await expect(page.locator("#Selector_Emojis_Popover"))
    .toHaveClass(/Activo/);

  await expect(input).toHaveAttribute("autocomplete", "off");
  await expect(input).toHaveAttribute("autocorrect", "off");
  await expect(input).toHaveAttribute("autocapitalize", "off");
  await expect(input).toHaveAttribute("spellcheck", "false");
  await expect(input).toHaveAttribute("inputmode", "none");
  await expect(input).toHaveJSProperty("readOnly", true);

  await page.keyboard.type("abc");
  await expect(input).toHaveValue("🎯");

  await page.keyboard.press("Escape");
  await expect(page.locator("#Selector_Emojis_Popover"))
    .not.toHaveClass(/Activo/);
  await expect(input).toHaveJSProperty("readOnly", false);

  await page.evaluate(() => {
    const dinamico = document.createElement("input");
    dinamico.id = "Emoji_Dinamico_Test";
    dinamico.className = "Con_Selector_Emoji";
    dinamico.value = "🧪";
    document.body.appendChild(dinamico);
  });
  const dinamico = page.locator("#Emoji_Dinamico_Test");
  await page.evaluate(() => {
    Abrir_Selector_Emojis(
      document.getElementById("Emoji_Dinamico_Test")
    );
  });
  await expect(page.locator("#Selector_Emojis_Popover"))
    .toHaveClass(/Activo/);
  await expect(dinamico).toHaveAttribute("autocomplete", "off");
  await expect(dinamico).toHaveJSProperty("readOnly", true);
});
