
Direct air capture (DAC), the removal of carbon dioxide from the atmosphere using engineered devices, has received increasing attention in recent years. Perhaps the most common criticism of DAC is: why not just use trees? After all, trees already use renewable energy (sunlight) to capture carbon dioxide from the air and produce a useful commodity with it (wood). Plus, they provide habitat for animals, look pretty, and are cheap and low-maintenance.

There are many responses to this question: trees release carbon dioxide back into the air when they die, improperly planned tree-planting can damage ecosystems, and trees can take a long time to grow and capture significant amounts of CO<sub>2</sub>. These are all tractable issues.  
  
**The most significant problem is that trees simply aren’t efficient.**
## The Inefficiency of Trees vs. DAC

To make a fair comparison between the efficiency of trees versus DAC, we need to be careful about defining our goal. We’ll consider two cases. (Note, we'll be using "tree" as a generic term for terrestrial biomass.)
##### Case 1: Carbon Capture and Sequestration (CCS)

Say that our goal is to remove carbon dioxide from the air and sequester it in a durable form, using solar energy. By default, if we let a tree grow and die naturally, the carbon dioxide it binds in it's biomass (wood, leaves, roots, etc.) over its lifetime will be released back into the air as the tree is decomposed by bacteria and fungi. The timescale of this decomposition can vary significantly with environmental conditions, but is [typically on the order of the lifetime of the tree](https://www.nature.com/articles/s41467-021-21149-9). The IPCC provides no definitive duration for “durable” storage, but a common definition is storage of at least 100 years. To store tree-captured carbon for more than a few decades, we need to convert wood into a form indigestible to decomposers. The most common solution to this problem is to pyrolyze wood, a process that can produce energy and produces a carbonized material known as “biochar”, which is able to durably store carbon with a [lifetime on the order of ~1000 years](https://pubs.acs.org/doi/10.1021/es902266r). Biochar production is currently the most widely practiced form of direct air capture and storage, with [one estimate suggesting](https://blog.alliedoffsets.com/current-biochar-facilities-removing-700000-tco2-annually?utm_source=chatgpt.com) it accounts for ~90% of current global direct-air CCS capacity. Direct air capture of carbon dioxide (including biochar) is still at a very early stage, however, and global capacity is only 700,000 tons per year.[^1]

To understand the efficiency of using trees for carbon capture then, we need the efficiency of a tree in converting solar energy into stored chemical energy (biomass), and understand what fraction of carbon from biomass can be durably stored by converting it to biochar. We can find robust estimates for both in the literature. High yield forests grown for carbon dioxide uptake [yield at most](https://www.researchgate.net/publication/288226164_Forest_plantations_for_climate_change_mitigation_-reviewing_estimates_of_net_primary_productivity_in_forest_plantations) 40 thousand kg of carbon per hectare of land per year. The average annual solar radiation in representative regions is [about 7,200 MJ/m^2/yr](https://www.sciencedirect.com/science/article/pii/S0960148114002560?utm_source=chatgpt.com).  Putting these numbers together, we find solar energy of ~490 MJ is required per kg of carbon dioxide converted to biomass. The efficiency of converting plant biomass into biochar is [25-50%](https://www.researchgate.net/publication/372092543_The_importance_of_biochar_quality_and_pyrolysis_yield_for_soil_carbon_sequestration_in_practice) in terms of the fraction of carbon retained (with the rest converted back into CO<sub>2</sub> during carbonization). To be generous, we'll take the upper end of this range as well.
  
Overall, this results in an energy cost of 982,000 kJ/kg of durably captured carbon dioxide. Biochar production also produces net energy (associated with pyrolysis of the biomass) of [~2,000 kJ per kg of carbon dioxide sequestered](https://www.css.cornell.edu/faculty/lehmann/publ/es071361i.pdf), as electricity. 

In contrast, a solar panel can convert sunlight into electrical energy with an efficiency of 21% (based on an average of new utility-scale solar deployments). Synthetic direct air capture in theory requires only 438 kJ/kg of carbon dioxide on a thermodynamics basis, but in practice, currently implemented systems [require 7,920 kJ/kg](https://link.springer.com/article/10.1557/s43581-024-00091-5?utm_source=chatgpt.com).  The most developed option to store carbon dioxide durably is to [[Carbon Mineralization|inject it underground]], with a typical energy requirement of 500 kJ/kg. Assuming all of the energy used comes from solar production, this implies 40,000 kJ of solar energy per kg of captured carbon dioxide. To put synthetic carbon capture on par with our biochar example, we'll also assume we need an additional 2,000 kJ of electricity production from our solar panels to match what is produced by biochar pyrolysis. This requires another 10,000 kJ of solar energy, bringing our total bill for synthetic carbon capture to 50,000 kJ of incident sunlight per kg of captured carbon dioxide. 

This means that even taking the most optimistic number for biological carbon capture at each step, it requires almost 20x more sunlight to capture a given amount of carbon.

##### Case 2: Carbon Capture and Utilization

Sequestering carbon dioxide underground provides no value beyond removing the CO<sub>2</sub> from the atmosphere. This makes it difficult to fund. Perhaps it would be better to use renewable energy to chemically convert carbon dioxide into a useful building block chemical (say, methanol), or back into carbon-neutral fuel (natural gas, oil).  
  
This approach seems like it could be more favorable to trees. Wood is already a valuable material, which we consume [2 billion tons of per year](https://openknowledge.fao.org/items/ec487897-97b5-43ec-bc2e-5ddfc76c8e85). Wood can also be more selectively decomposed into valuable industrial chemicals. Methanol is colloquially known as "wood alcohol" because it can be produced through distillation of wood (with [~25% yield](https://research.fs.usda.gov/treesearch/9818#:~:text=The%20yield%20of%20methanol%20from,coming%20from%20the%20wood%20waste.) of converted carbon atoms). Several researchers are currently working on new processes for converting lignin into sustainable jet fuel. We'll consider a variety of common materials that we could convert carbon dioxide into. This table shows a few options, and the corresponding state of technology for carrying out the transformations:

| Product                  | Carbon Converted                                                                                                                                    | TRL                                                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Methane                  | [47%](https://link.springer.com/article/10.1007/s13399-020-00910-y)                                                                                 | [8-9](https://www.etipbioenergy.eu/wp-content/uploads/2025/05/ETIP-Bioenergy_Current_Status_of_Adv_Biofuels_Demonstrations_in_Europe.pdf) |
| Methanol                 | [33%](https://docs.nrel.gov/docs/fy21osti/78547.pdf)                                                                                                | [9](https://www.etipbioenergy.eu/wp-content/uploads/2025/05/ETIP-Bioenergy_Current_Status_of_Adv_Biofuels_Demonstrations_in_Europe.pdf)   |
| Ethanol                  | [34%](https://www.sciencedirect.com/science/article/pii/S030626192100917X?utm_source=chatgpt.com)                                                   | [9](https://www.etipbioenergy.eu/wp-content/uploads/2025/05/ETIP-Bioenergy_Current_Status_of_Adv_Biofuels_Demonstrations_in_Europe.pdf)   |
| Diesel/Gasoline/Jet-Fuel | [~40%](https://www.researchgate.net/publication/231274487_Fischer-Tropsch_Synfuels_from_Biomass_Maximizing_Carbon_Efficiency_and_Hydrocarbon_Yield) | [6-8](https://www.etipbioenergy.eu/wp-content/uploads/2025/05/ETIP-Bioenergy_Current_Status_of_Adv_Biofuels_Demonstrations_in_Europe.pdf) |

Now for the synthetic option. We already found the solar energy consumption of trees to be 481,000 kJ/kg of carbon dioxide converted into biomass. In reality only about half of this biomass is woody materials that can be used for many of these transformations, but we'll neglect that for now. The efficiency of solar panels remains about 21% 

As we cited above, the energy efficiency of currently implemented carbon capture processes is about 8,000 kJ/kg, and the synthetic process still needs to bear this cost for carbon utilization as well.

This time though, we also need to consider the energy required to reduce carbon dioxide into valuable products. In all cases, chemical reduction of carbon dioxide into valuable products proceeds through hydrogen. We can make a table of the amount of hydrogen, and selectivity, of converting carbon dioxide into various valuable products: 

| Product                  | Reaction                                                 | Hydrogen per CO2 (moles) | Hydrogen per CO2 (mass) | Selectivity                                                                           | Technology Readiness Level |
| ------------------------ | -------------------------------------------------------- | ------------------------ | ----------------------- | ------------------------------------------------------------------------------------- | -------------------------- |
| Methane (Natural Gas)    | $$\ce{CO2 + 4 H2 \rightleftharpoons CH4 + 2 H2O }$$      | 4                        | 0.666                   | [100%](https://www.mdpi.com/2073-4344/12/2/244)                                       | 9                          |
| Methanol                 | $$\ce{CO2 + 3H2 \rightleftharpoons CH3OH + H2O}$$        | 3                        | 0.500                   | [>98%](https://www.nature.com/articles/s41467-019-13638-9?utm_source=chatgpt.com)     | 9                          |
| Ethanol                  | $$\ce{2 CO2 + 6 H2 \rightleftharpoons C2H5OH +3 H2O}$$   | 3                        | 0.500                   | [~98.5%](https://onlinelibrary-wiley-com.libproxy.mit.edu/doi/10.1002/anie.202422744) | 3                          |
| Diesel/Gasoline/Jet-Fuel | $\ce{n CO2 + 3n H2 \rightleftharpoons (CH2)_n + 2n H2O}$ | 3                        | 0.500                   | [~85%](https://docs.nrel.gov/docs/fy04osti/34929.pdf)                                 | 9                          |

To finish this table, we need to account for the energy to produce renewable hydrogen. The two primary technologies for this are alkaline water electrolysis ([~65% efficient](https://www.enectiva.cz/en/blog/2023/08/comparison-of-the-various-kinds-of-electrolyzers-for-hydrogen-production/)) and proton exchange membrane electrolysis ([~80% efficient](https://senzahydrogen.com/pem-hydrogen-generator-vs-alkaline-hydrogen-generator/)), so electrical energy costs are 178,000 - 220,000 kJ/kg $\ce{H2}$, depending on the technology used. We'll take 200,000 kJ/kg as the reference value. 

Now we can combine our tables to compare the energy efficiency of trees versus synthetic chemical processes for each product:

| Product                  | kJ Sunlight per Kg CO2 Converted (Biological) | kJ Sunlight per Kg CO2 Converted (Synthetic) |
| ------------------------ | --------------------------------------------- | -------------------------------------------- |
| Methane                  | ~1,000,000                                    | ~140,000                                     |
| Methanol                 | ~1,450,000                                    | ~110,000                                     |
| Ethanol                  | ~1,400,000                                    | ~110,000                                     |
| Diesel/Gasoline/Jet-Fuel | ~960,000                                      | ~130,000                                     |

As we can see, for simple products, which are the ones with the largest demands and most capable of absorbing a significant amount of the total global CO2 production, the chemical processes are significantly more efficient at converting sunlight into utilized carbon. For more advanced products (e.g. wood itself!) starting from biomass may have a niche. For some particular compounds, e.g. ethanol, acetic acid, the biological route may be at a higher TRL, but synthetic processes are under active development.
### What Makes Trees Inefficient?

The general outlines of photosynthesis are conserved between all plants, but there are significant variations in the specific metabolic pathways used. The three primary types are C3, C4, and CAM.

These methods all start the same way, chlorophyll absorbs sunlight, and captures a fraction of the light as chemical energy. The first inefficiency comes from the limited fraction of solar energy that the chlorophyll can absorb. Solar panels also have a limited spectrum across which they can absorb light, but a side-by-side comparison of the part of the solar spectrum they can capture is helpful:

![[Pasted image 20250621005705.png]]
So right off the bat, only ~43% of sunlight is accessible to the plants. Moreover, energy in each photon in excess of the energy needed to excite chlorophyll is wasted, so only 32.3% of the energy in the solar spectrum is actually usable. Also, because chlorophyll doesn't cover the whole surface of a leaf, only ~70% of this energy is actually captured. 

A similar limitation applies to solar panels, but a much larger ~81% of the solar spectrum is in accessible regions, and ~49% of the energy is theoretically usable. Solar panels also have losses due to e.g. wires covering part of the surface, but [~97% of the solar panel remains accessible](https://www.qualenergia.it/wp-content/uploads/2024/06/ITRPV-15th-Edition-2024-2.pdf?utm_source=chatgpt.com) to the sun. Other energy losses include light not actually absorbed (reflected or transmitted through panel), ohmic losses due in contacts/wires, recombination of electron/hole pairs, etc. All of this leads to the actual ~20.6% efficiency seen in utility-scale solar deployments.  

![[Pasted image 20250621010355.png]]

Plants need to pass the excited electrons produced by chlorophyll down the "electron transport chain". In this process, another 24% of the energy is lost to heat. Plants use the energy at this stage to, in essence, carry out water splitting as well. Except instead of producing free hydrogen molecules as the end product, they're using NADP+ as a carrier molecule (link out), converting it into NADPH. This step is particularly inefficient, resulting in only about a 30% efficiency, notably lower than even relatively low-end alkaline electrolyzers. 

Plants also need to carry out the direct air capture step. The primary inefficiency here is the responsibility of the RuBisCO enzyme, which is responsible for fixing carbon dioxide. Because of the high ratio of oxygen to carbon dioxide in the air, RuBisCO only successfully captures a carbon dioxide (instead of an oxygen) 50-75% of the time, resulting in an energy loss of 20-50% at this step. Some researchers are working on [ways to make the RuBisCO enzyme more selective](https://www.sciencedirect.com/science/article/pii/S2405805X23001138) for $\ce{CO2}$, though early efforts in this direction have faced a tradeoff with lower reaction rates for more selective variants. There's still a long way to go to get genetically modified plants using this superior RuBisCO enzyme, but this an exciting development. 

Once RuBisCO has actually captured the carbon dioxide, the process of converting the carbon dioxide into glucose, a chemically complex reduction product, is strikingly efficient, resulting in only a 10% energy loss. By chemical standards, this is a key advantage of plants. Unfortunately, it's swamped by all of the other losses. 

There's one more loss here. Plants are alive, and need to consume some energy to maintain themselves. This ends up being in the range of 35-45% of the sugar produced through this process. Finally, the carbon dioxide also needs to be converted into a durable form, like wood. 

<b> Overall our resulting efficiency is: 2.1% </b>

This is at the upper bound of efficiency for plants, in practice sub-optimal growing conditions often result in efficiencies significantly lower than this. For trees, 0.1%-1% efficiency is considered typical. 

Of course there are a large diversity of plants, which vary subtly along many of these steps. However, the overall energy efficiency picture is similar. Cyanobacteria can produce some of the best numbers here, for a variety of reasons (they're supporting less extra machinery, they aren't converting the CO2 all the way to wood, just to sugars, etc.). But maintaining these peak efficiencies is [a much trickier process](https://www.mdpi.com/1660-3397/21/8/445) compared to leaving a tree to grow. Moreover, we need to get bacteria to produce valuable materials from sugar. Genetic engineering presents exciting opportunities here, but the [bioengineering revolution is taking longer](https://www.lesswrong.com/posts/YextGGfwqKSmNanFh/what-s-behind-the-synbio-bust) than many originally hoped.

Interestingly, plants are more efficient in low-light conditions. This is why, despite this overall inefficiency, growing plants indoors (where the [ambient light levels are commonly >10x lower than outside](https://www.velux.com/what-we-do/research-and-knowledge/deic-basic-book/daylight/daylight-calculations-and-measurements?utm_source=chatgpt.com)) or under artificial lighting, is feasible. 

If we make a rough graph of [plant efficiency versus solar intensity](https://www.nature.com/articles/s41598-019-46248-y) (for rice leaves) we get:

![[Pasted image 20250621003804.png]]
(Note that these values are quite high because this is just looking at immediate efficiency in the leaf, not including e.g. photorespiration at night, inefficiency in converting light to stored biomass, etc.).

But the solar intensity in e.g. the California desert is [~1100 watts per square meter](https://www.nrel.gov/gis/solar-resource-maps). 

So plants aren't really optimized for using ample sunny land we have available. Solar on the other hand [maintains it's efficiency perfectly well at high solar intensity](https://sustainabletechnologies.ca/app/uploads/2017/10/Irrad-Eff-Tech-Brief_v11.pdf):

![[Pasted image 20250621005216.png]]

In fact, at high solar intensities, part of the reason plant efficiency drops off is that they need to start expending energy to keep cool. This requires them to direct [~95% of the water they uptake into evaporative cooling](https://www.nature.com/scitable/knowledge/library/water-uptake-and-transport-in-vascular-plants-103016037/), and to e.g. synthetize complex hydrocarbons (isoprene) just to evaporate them off their leaves for further cooling. (As a side note, this is a [major contributor](https://pmc.ncbi.nlm.nih.gov/articles/PMC6260947/) to deadly air pollution. 

This mismatch in efficiency raises the possibility of combining solar with agriculture, or "agrivoltaics" as proponents call it. [This could help combat one of the main objections to converting everything to solar](https://www.energy.gov/eere/solar/agrivoltaics-solar-and-agriculture-co-location) (it uses too much land), though this already wasn't much of a concern. I'm not generally optimistic about dual-use schemes like this, but there is at least a thermodynamic basis for this to be a good idea.

# But what about the other benefits of trees?

Of course, other than the pure efficiency, trees have some other properties that make them appealing. For one, they're dirt cheap (costs to plant a tree are [~$1 per tree](https://trilliontrees.org/wp-content/uploads/2022/08/Trillion-Trees_Defining-the-real-cost-of-restoring-forests.pdf?utm_source=chatgpt.com), though this increases to [~$2 per tree](https://pmc.ncbi.nlm.nih.gov/articles/PMC9661948/) when accounting for long-term failure rates). 

But beyond this, they can provide habitat for other species, can improve the quality of streams, and (do other good things)?

Also, many people, for some reason, find trees to be more aesthetically appealing than synthetic $\ce{CO2}$ capture facilities. 
 ![[Pasted image 20250620225740.png]] ![[Pasted image 20250620225630.png]] 
There's lots of good reasons to plant trees, but because they are so inefficient for carbon capture, it's simply not viable to use them to solve the climate crisis. 

[^1]:  If we include carbon captured from concentrated industrial sources, [the total rises to around 50 million tons per year](https://about.bnef.com/blog/global-carbon-capture-capacity-due-to-rise-sixfold-by-2030/?utm_source=chatgpt.com), and all direct air capture, biochar included, becomes a small component.
