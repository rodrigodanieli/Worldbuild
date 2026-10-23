import { Extension, markInputRule, wrappingInputRule } from "@tiptap/core";

// Extensão personalizada que garante os atalhos específicos solicitados pelo usuário:
// ~texto~ para tachado, " ou | para citação, $$ para bloco/marcação matemática
export const CustomMarkdownShortcuts = Extension.create({
  name: "customMarkdownShortcuts",

  addInputRules() {
    const rules = [];

    // 1. Tachado com til simples ~texto~ além de ~~texto~~
    if (this.editor.schema.marks.strike) {
      rules.push(
        markInputRule({
          find: /(?:^|\s)(~(?!\s+~)([^~]+)~)$/,
          type: this.editor.schema.marks.strike,
        })
      );
    }

    // 2. Citação com " + espaço ou | + espaço
    if (this.editor.schema.nodes.blockquote) {
      rules.push(
        wrappingInputRule({
          find: /^(?:"|\|)\s$/,
          type: this.editor.schema.nodes.blockquote,
        })
      );
    }

    // 3. Equação inline $$equação$$ ou $equação$ (usando estilo código/itálico estilizado)
    if (this.editor.schema.marks.code) {
      rules.push(
        markInputRule({
          find: /(?:^|\s)(\$\$([^\$]+)\$\$)$/,
          type: this.editor.schema.marks.code,
        })
      );
    }

    return rules;
  },
});
