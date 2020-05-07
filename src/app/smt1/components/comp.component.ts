import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { FusionDataService } from '../fusion-data.service';
import { NameTrio, DemonTrio } from '../../../app/compendium/models';
import { toDemonTrioResult } from 'src/app/compendium/models/conversions';
import { Demon, CompendiumConfig } from '../models';

@Component({
  selector: 'smt1-comp',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div>
    My demons :
    <app-smt-demon-list
      [raceOrder]="compConfig.raceOrder"
      [statHeaders]="compConfig.baseStats"
      [resistHeaders]="compConfig.resistElems"
      [inheritOrder]="compConfig.elemOrder"
      [rowData]="compDemons">
    </app-smt-demon-list>
    Results :
    <ul>
      <li *ngFor="let demonResult of demonResults">{{ demonResult.d1.name }} + {{ demonResult.d2.name }} = {{ demonResult.d3.name }}</li>
    </ul>
  </div>
  `
})
export class CompComponent {
  @Input() compDemons: Demon[];
  @Input() demonResults: DemonTrio[];
  compConfig: CompendiumConfig;

  constructor(fusionDataService: FusionDataService) {
    this.compConfig = fusionDataService.compConfig;
    const demonNames = ['Abaddon', 'Fenrir', 'Shuten Doji', 'Lakshmi', 'Tam Lin', 'Hanuman'];
    fusionDataService.compendium.subscribe(compendium => {
      fusionDataService.fusionChart.subscribe(fusionChart => {
        this.compDemons = demonNames.map(n => compendium.getDemon(n));
        const reduceResults = (results: DemonTrio[], sourceDemon: Demon, idx: number) => {
          if(idx === this.compDemons.length-1) {
            return results;
          }
          const fusions = fusionDataService.fusionCalculator.getFusions(sourceDemon.name, compendium, fusionChart);
          const otherDemons = this.compDemons.slice(idx+1);
          const reduceFusions = (resultDemons: DemonTrio[], targetDemon: Demon) => {
            const fusionResult = fusions.find(namePair => namePair.name1 === targetDemon.name);
            if(!fusionResult) {
              return resultDemons;
            }
            const resultDemon = fusionResult.name2;
            const nameTrio: NameTrio = { name1: sourceDemon.name, name2: targetDemon.name, name3: resultDemon };
            return [...resultDemons, toDemonTrioResult(nameTrio, compendium)];
          };
          const possibleResults: DemonTrio[] = otherDemons.reduce(reduceFusions, []);
          return [...results, ...possibleResults];
        };
        this.demonResults = this.compDemons.reduce(reduceResults, [] as DemonTrio[]);
      });
    });
  }
}
