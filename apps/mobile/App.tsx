import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { calculateModifier, formatModifier, calculateProficiencyBonus } from "@worldbuild/dnd-rules";

export default function App() {
  const [level, setLevel] = useState(3);
  const [hp, setHp] = useState(24);
  const maxHp = 28;

  const attributes = {
    for: 16,
    des: 14,
    con: 15,
    int: 10,
    sab: 12,
    car: 8,
  };

  const profBonus = calculateProficiencyBonus(level);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0f14" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabeçalho do Personagem */}
        <View style={styles.headerCard}>
          <Text style={styles.charName}>Kaelen Sombra-da-Noite</Text>
          <Text style={styles.charClass}>Guerreiro (Mestre de Batalha) • Nível {level}</Text>
          <Text style={styles.campaignTag}>Vínculo: Campanha Reino de Eldoria (Sincronizado)</Text>
        </View>

        {/* Barra de Vida Interativa */}
        <View style={styles.hpCard}>
          <View style={styles.hpRow}>
            <Text style={styles.sectionTitle}>Pontos de Vida</Text>
            <Text style={styles.hpValues}>{hp} / {maxHp} PV</Text>
          </View>
          <View style={styles.hpBarBackground}>
            <View style={[styles.hpBarFill, { width: `${(hp / maxHp) * 100}%` }]} />
          </View>
          <View style={styles.hpButtons}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnDamage]} 
              onPress={() => setHp((prev) => Math.max(0, prev - 1))}
            >
              <Text style={styles.btnText}>-1 Dano</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btn, styles.btnHeal]} 
              onPress={() => setHp((prev) => Math.min(maxHp, prev + 1))}
            >
              <Text style={styles.btnText}>+1 Cura</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resumo de Combate Rápido */}
        <View style={styles.combatRow}>
          <View style={styles.combatBox}>
            <Text style={styles.combatLabel}>CA</Text>
            <Text style={styles.combatValue}>18</Text>
          </View>
          <View style={styles.combatBox}>
            <Text style={styles.combatLabel}>Iniciativa</Text>
            <Text style={styles.combatValue}>{formatModifier(calculateModifier(attributes.des))}</Text>
          </View>
          <View style={styles.combatBox}>
            <Text style={styles.combatLabel}>Proficiência</Text>
            <Text style={styles.combatValue}>+{profBonus}</Text>
          </View>
        </View>

        {/* Grid de Atributos */}
        <Text style={[styles.sectionTitle, { marginTop: 16, marginBottom: 8 }]}>Atributos</Text>
        <View style={styles.attributesGrid}>
          {Object.entries(attributes).map(([attr, score]) => {
            const mod = calculateModifier(score);
            return (
              <View key={attr} style={styles.attrCard}>
                <Text style={styles.attrKey}>{attr.toUpperCase()}</Text>
                <Text style={styles.attrMod}>{formatModifier(mod)}</Text>
                <Text style={styles.attrScore}>{score}</Text>
              </View>
            );
          })}
        </View>

        {/* Itens e Vínculos com a Wiki */}
        <View style={styles.wikiLinkCard}>
          <Text style={styles.sectionTitle}>Equipamentos Vinculados à Wiki</Text>
          <Text style={styles.wikiItem}>🗡️ Espada Longa Forjada em Mithral (Página #item)</Text>
          <Text style={styles.wikiItem}>🛡️ Escudo de Carvalho dos Guardiões (Página #item)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0f14",
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: "#141721",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e2433",
    marginBottom: 12,
  },
  charName: {
    color: "#f3f4f6",
    fontSize: 20,
    fontWeight: "bold",
  },
  charClass: {
    color: "#d97706",
    fontSize: 14,
    marginTop: 2,
    fontWeight: "500",
  },
  campaignTag: {
    color: "#10b981",
    fontSize: 12,
    marginTop: 6,
  },
  hpCard: {
    backgroundColor: "#141721",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e2433",
    marginBottom: 12,
  },
  hpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "600",
  },
  hpValues: {
    color: "#f87171",
    fontWeight: "bold",
    fontSize: 16,
  },
  hpBarBackground: {
    height: 8,
    backgroundColor: "#2d1515",
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: 4,
  },
  hpBarFill: {
    height: "100%",
    backgroundColor: "#ef4444",
  },
  hpButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  btnDamage: {
    backgroundColor: "#7f1d1d",
  },
  btnHeal: {
    backgroundColor: "#065f46",
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 13,
  },
  combatRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  combatBox: {
    flex: 1,
    backgroundColor: "#141721",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e2433",
  },
  combatLabel: {
    color: "#94a3b8",
    fontSize: 11,
    textTransform: "uppercase",
  },
  combatValue: {
    color: "#f1f5f9",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 2,
  },
  attributesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  attrCard: {
    width: "31%",
    backgroundColor: "#141721",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e2433",
  },
  attrKey: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "bold",
  },
  attrMod: {
    color: "#f59e0b",
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 2,
  },
  attrScore: {
    color: "#64748b",
    fontSize: 11,
  },
  wikiLinkCard: {
    backgroundColor: "#141721",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e2433",
  },
  wikiItem: {
    color: "#cbd5e1",
    fontSize: 13,
    marginTop: 8,
  },
});
