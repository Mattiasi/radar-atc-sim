const fs = require('fs');
let code = fs.readFileSync('src/core/engine.js', 'utf8');

code = code.replace(/export function gerenciarFilaDEP\(\) \{[\s\S]*?function spawnDEP\(dep\)/, \window.tentarDecolar = function(dep) {
    const ultima = state.configDep.ultimaAeronaveDecolada;

    let podeDecolar = true;
    let motivoBloqueio = "";

    if (ultima && ultima.aero === dep.aero) {
        const tempoDesdeUltima = (performance.now() - state.configDep.ultimaDecolagemTick) / 1000;
        
        if (dep.aero === 'SBKP') {
            const mesmoGrupo = (ultima.grupoDep === dep.grupoDep);
            if (mesmoGrupo && ultima.category === 'turboprop' && dep.category === 'jet') {
                if (tempoDesdeUltima < 4 * 60) { podeDecolar = false; motivoBloqueio = "Separação por esteira (Turbo/Jato, mesmo grupo) - Mínimo 4 minutos."; }
            } else if (mesmoGrupo && ultima.category === 'turboprop' && dep.category === 'turboprop') {
                if (tempoDesdeUltima < 2 * 60) { podeDecolar = false; motivoBloqueio = "Separação por esteira (Turbo/Turbo, mesmo grupo) - Mínimo 2 minutos."; }
            } else if (!mesmoGrupo && ultima.category === 'piston' && (dep.category === 'jet' || dep.category === 'turboprop')) {
                if (tempoDesdeUltima < 3 * 60) { podeDecolar = false; motivoBloqueio = "Separação por esteira (Pistão -> Turbo/Jato, grupos diferentes) - Mínimo 3 minutos."; }
            } else if (mesmoGrupo && ultima.category === 'piston' && (dep.category === 'jet' || dep.category === 'turboprop')) {
                if (!dep.coordenacaoFeita) { podeDecolar = false; motivoBloqueio = "Requer coordenação com APP-SP para Jato/Turbo após Pistão no mesmo grupo."; }
            }
        }

        if (dep.aero === 'SBGR') {
            const lastAeroObj = state.aeronaves.find(a => a.callsign === ultima.id);
            if (lastAeroObj) {
                if (ultima.setorSaida === 'Leste') {
                    if (lastAeroObj.nivAtual < 60) { podeDecolar = false; motivoBloqueio = "Precedente setor Leste precisa cruzar 6000 ft em subida."; }
                } else if (ultima.setorSaida === 'Sul') {
                    if (lastAeroObj.nivAtual < 70) { podeDecolar = false; motivoBloqueio = "Precedente setor Sul precisa cruzar 7000 ft em subida."; }
                }
            }
            if (dep.setorSaida === 'Norte' && !dep.coordenacaoFeita) {
                podeDecolar = false; motivoBloqueio = "Saída setor Norte exige coordenação com APP-SP.";
            }
        }

        if (dep.aero === 'SBSP') {
            if (ultima.setorSaida === dep.setorSaida) {
                if (tempoDesdeUltima < 2 * 60) { podeDecolar = false; motivoBloqueio = "SBSP: 2 minutos de separação para o mesmo setor."; }
            }
        }
    }

    if (podeDecolar) {
        dep.status = 'autorizado'; // Will spawn immediately and become em_voo
        spawnDEP(dep);
    } else {
        alert("Decolagem bloqueada: " + motivoBloqueio);
    }
};

function spawnDEP(dep)\);

fs.writeFileSync('src/core/engine.js', code);
