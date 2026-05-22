import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// =========================================================================
// CRITICAL HISTORICAL PEDIGREE CORE SPEC: AUSTIN BITCOIN++ 2022
// =========================================================================
const LEGACY_SATS_FUNDING_TX = "c3a7786e164bbc7620a90601a1f284cff1a5e93c59978f566a9c7104bc33975a";
const TOTAL_WALLETS = 41; // 41 P2TR Paper Wallet Outputs
const LEGACY_WALLET_CAPACITY = 10000;
const HISTORICAL_OFFSET_START = 1567204400000000;

app.post('/api/audit', async (req, res) => {
  try {
    let { address } = req.body;
    if (!address) return res.status(400).json({ error: "Missing target address." });
    
    address = address.trim();
    let targetUtxos = [];

    // DETECTOR LAYER: Genesis TxID vs Wallet Address
    if (address.toLowerCase() === LEGACY_SATS_FUNDING_TX || address.length === 64) {
      try {
        const txResponse = await fetch(`https://mempool.space/api/tx/${LEGACY_SATS_FUNDING_TX}`);
        const txData = await txResponse.json();
        targetUtxos = txData.vout.map((output, idx) => ({ txid: LEGACY_SATS_FUNDING_TX, vout: idx, value: output.value }));
      } catch (e) {
        console.error("Mempool API error:", e.message);
      }
    } else {
      try {
        const response = await fetch(`https://mempool.space/api/address/${address}/utxo`);
        targetUtxos = await response.json();
      } catch (e) {
        console.error("Address lookup error:", e.message);
      }
    }

    let summary = { totalLegacySats: 0, totalOrdinals: 0, totalRunes: 0, totalAlkanes: 0 };
    let auditedUtxos = targetUtxos.map(utxo => {
      let tags = [];
      let ranges = [];

      // Logic: Tagging and Range Mapping
      if (utxo.txid === LEGACY_SATS_FUNDING_TX && utxo.vout < TOTAL_WALLETS) {
        tags.push('legacy');
        summary.totalLegacySats += utxo.value;
        const start = HISTORICAL_OFFSET_START + (utxo.vout * LEGACY_WALLET_CAPACITY);
        ranges.push(`${start} - ${start + utxo.value - 1}`);
      } else {
        ranges.push("Standard Range");
      }

      // Mock detection for demonstration of filter UI
      if (Math.random() > 0.7) { tags.push('ord'); summary.totalOrdinals++; }
      if (Math.random() > 0.8) { tags.push('rune'); summary.totalRunes++; }
      if (Math.random() > 0.9) { tags.push('alkane'); summary.totalAlkanes++; }

      return {
        outpoint: `${utxo.txid}:${utxo.vout}`,
        value: utxo.value,
        ranges: ranges.join(', '),
        tags: tags
      };
    });

    res.json({ summary, utxos: auditedUtxos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 5555;
app.listen(PORT, () => console.log(`🚀 Auditor Kernel Live at Port ${PORT}`));