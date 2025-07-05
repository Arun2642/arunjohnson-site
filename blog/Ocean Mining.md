
Mining is notorious for it's harsh environmental and health consequences. Moving around millions of tons of earth, crushing the resulting rocks, and treating them with extremely harsh chemicals all require massive amounts of energy and result in significant pollution of the environment. 

Ocean mining presents an opportunity to mine some critical minerals without many of these side-effects, and could be substantially more cost-effective at scale. Note, some people who talk about ocean mining mean picking up minerals at the bottom of the ocean, e.g. [manganese nodules](https://en.wikipedia.org/wiki/Manganese_nodule). This is not what we're talking about today. 

The ocean is salty. While the vast majority of it's salt is sodium chloride (so-called table salt), there are also lower concentrations of many other salts, some of which are industrially valuable. If we look at a table of ionic components in the ocean, [we see](https://en.wikipedia.org/wiki/Seawater):

| Component                 | Concentration (mol/kg) |
| ------------------------- | ---------------------: |
| $\ce{H2O}$                |     $5.36\times10^{1}$ |
| $\ce{Cl-}$                |    $5.46\times10^{-1}$ |
| $\ce{Na+}$                |    $4.69\times10^{-1}$ |
| $\ce{Mg^{2+}}$            |    $5.28\times10^{-2}$ |
| $\ce{SO4^{2-}}$           |    $2.82\times10^{-2}$ |
| $\ce{Ca^{2+}}$            |    $1.03\times10^{-2}$ |
| $\ce{K+}$                 |    $1.02\times10^{-2}$ |
| $\text{Dissolved Carbon}$ |    $2.06\times10^{-3}$ |
| $\ce{Br-}$                |    $8.44\times10^{-4}$ |
| $\text{Dissolved Boron}$  |    $4.16\times10^{-4}$ |
| $\ce{Sr^{2+}}$            |    $9.10\times10^{-5}$ |
| $\ce{F-}$                 |    $6.80\times10^{-5}$ |
Most of these are not very valuable. If we zoom out to even lower concentrations [we see:](https://www.mbari.org/know-your-ocean/periodic-table-of-elements-in-the-ocean/summary-table/)

![[Pasted image 20250703170405.png]]

Now we see lots of valuable metals. But many of them exist at less than $10^{-10}$ moles per liter! Because the ocean is so vast, this can still correspond to a very large total amount of each metal. For example, even though uranium has a concentration of only around $10^{-8}$ moles per liter, since the ocean contains $10^{18}$ liters, this corresponds to around [4 billion metric tons](https://www.epj-n.org/articles/epjn/full_html/2016/01/epjn150059/epjn150059.html) of uranium. This makes for an extremely difficult separations problem. If we make a plot of the concentrations of these ions versus [their cost](http://www.leonland.de/elements_by_price/en/list) per mole, we get the following scatter plot:

![[Pasted image 20250703180803.png]]

In general, we can expect the most practical elements to mine from the ocean will be those that are closer to the top right of this chart -- relatively high prevalence in the ocean, coupled with relatively high market value. There are several caveats there: some of these elements are far easier to selectively bind than others, and some may exist in chemical forms that require more energy to process into sellable forms than others. Still, this provides some sense of which elements could be feasible to extract from ocean water. A similar way we can slice the data is to directly consider the value of each element present in a given volume of ocean water:

![[Pasted image 20250703183855.png]]

It is also worth noting that we have been using mean concentrations, but not all of these metals exist at an equal concentration throughout the depth profile of the ocean. Many of these elements are used by living organisms, and since most life exists at the surface of the ocean (link out), most of these elements are depleted in the surface layer. Some of them are so strongly accumulated by living organisms that they become concentrated in the surface layer instead. Still other elements are either unused by life, or exist in such high concentrations relative to the quantities required by living organisms that they have no surface enrichment or depletion. The chart below summarizes these differences:

![[Pasted image 20250530094007.png]]

[This graphic](https://www.soest.hawaii.edu/oceanography/courses/OCN623/Spring2011/trace_elements.pdf) shows that the actual concentration in the seawater can vary over multiple orders of magnitude depending on the depth. The triangles are the upper end of the concentration, while the bars show the range of concentrations throughout the depth column:

![[Pasted image 20250530093323.png]]

The fact that some life forms are able to scavenge some minerals so effectively suggests the use of these bio-accumulators as a mining mechanism. This concept, "[phytomining](https://en.wikipedia.org/wiki/Phytomining)", has been explored on land both for remediation of contaminated soils and for mining applications. For remediation, [lead and arsenic accumulating plants](https://19january2017snapshot.epa.gov/sites/production/files/2015-06/documents/phytoremediation.pdf) have been used by several government agencies and private companies. Meanwhile for mining, in 2024, ARPA-E committed $10 million in funding to trial [nickel and cobalt phytomining](https://www.wired.com/story/the-feds-are-trying-to-get-plants-to-mine-metal-through-their-roots). Recently, a startup, [Orca Materials](https://www.fastcompany.com/91328593/why-this-startup-is-mining-seaweed-to-power-evs), has begun exploring the use of seaweed for harvesting Scandium (a rare earth element), and possibly other minerals. [ARPA-E is also funding](https://theweek.com/environment/seaweed-mining-minerals) research into oceanic phytomining with seaweed. 
