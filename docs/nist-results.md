# NIST StRD check (nonlinear regression)

SciPy `curve_fit` in the browser (Pyodide) against NIST certified values. Standard errors are the unweighted ones NIST certifies (`absolute_sigma=False`). "Digits" = correct significant digits (log10 of the relative error, capped at 9). Pass: values ≥ 6 digits, standard errors ≥ 4 digits, residual sum of squares ≥ 6 digits.

## Misra1a (niedrig): b1*(1-np.exp(-b2*x))

Start 1 (500, 0.0001): 

| Parameter | Certified | SciPy | Digits | Cert. std. error | SciPy std. error | Digits |
|---|---|---|---|---|---|---|
| b1 | 238.94212918 | 238.94212978116678 | 8.6 | 2.7070075241 | 2.7070075710032 | 7.8 |
| b2 | 0.00055015643181 | 0.0005501564301869633 | 8.5 | 0.0000072668688436 | 0.000007266868915037521 | 8.0 |

Residual sum of squares: certified 0.12455138894, SciPy 0.12455138894439702, digits 9.0. Degrees of freedom: 12 (certified 12).

Start 2 (250, 0.0005): 

| Parameter | Certified | SciPy | Digits | Cert. std. error | SciPy std. error | Digits |
|---|---|---|---|---|---|---|
| b1 | 238.94212918 | 238.94212844282777 | 8.5 | 2.7070075241 | 2.707007650016404 | 7.3 |
| b2 | 0.00055015643181 | 0.0005501564337845524 | 8.4 | 0.0000072668688436 | 0.00000726686919401875 | 7.3 |

Residual sum of squares: certified 0.12455138894, SciPy 0.12455138894440058, digits 9.0. Degrees of freedom: 12 (certified 12).

## Misra1d (durchschnittlich): b1*b2*x*((1+b2*x)**(-1))

Start 1 (500, 0.0001): 

| Parameter | Certified | SciPy | Digits | Cert. std. error | SciPy std. error | Digits |
|---|---|---|---|---|---|---|
| b1 | 437.36970754 | 437.36970852750363 | 8.6 | 3.6489174345 | 3.6489173226097256 | 7.5 |
| b2 | 0.00030227324449 | 0.0003022732436959895 | 8.6 | 0.0000029334354479 | 0.000002933435353616699 | 7.5 |

Residual sum of squares: certified 0.056419295283, SciPy 0.056419295282641356, digits 9.0. Degrees of freedom: 12 (certified 12).

Start 2 (450, 0.0003): 

| Parameter | Certified | SciPy | Digits | Cert. std. error | SciPy std. error | Digits |
|---|---|---|---|---|---|---|
| b1 | 437.36970754 | 437.3697090266012 | 8.5 | 3.6489174345 | 3.6489170860236952 | 7.0 |
| b2 | 0.00030227324449 | 0.000302273243293625 | 8.4 | 0.0000029334354479 | 0.000002933435149135705 | 7.0 |

Residual sum of squares: certified 0.056419295283, SciPy 0.05641929528264737, digits 9.0. Degrees of freedom: 12 (certified 12).

## BoxBOD (hoch): b1*(1-np.exp(-b2*x))

Start 1 (1, 1): no result, with a clear message (accepted: NIST start 1 is the hard start for this dataset; a wrong number would fail): "ValueError: Die Anpassung ist nicht konvergiert. Andere Startwerte oder ein anderes Modell versuchen."

Start 2 (100, 0.75): 

| Parameter | Certified | SciPy | Digits | Cert. std. error | SciPy std. error | Digits |
|---|---|---|---|---|---|---|
| b1 | 213.80940889 | 213.8094088669262 | 9.0 | 12.354515176 | 12.35451521012119 | 8.6 |
| b2 | 0.54723748542 | 0.5472374857655797 | 9.0 | 0.10455993237 | 0.10455993179083278 | 8.3 |

Residual sum of squares: certified 1168.0088766, SciPy 1168.0088765555536, digits 9.0. Degrees of freedom: 4 (certified 4).

