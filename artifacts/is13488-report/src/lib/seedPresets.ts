import type { Preset, StandardSpec } from './types';

export const defaultPresets: Preset[] = [
  {
    "id": "92ef77df-dbff-4fb7-9184-0dc1b7fedc1a",
    "name": "12 mm, Class - 2, 1.20 LPH",
    "size": "12 mm",
    "className": "2",
    "category": "B, Unregulated",
    "discharge": 1.2,
    "minFlowPath": {
      "value": 0.6,
      "min": 0.6,
      "max": 0.85
    },
    "specimenLength": 240,
    "lengthBeforeTest": 150,
    "appliedLoad": 75,
    "carbonCrucibleWeight": {
      "value": 11.7784,
      "min": 11.776,
      "max": 11.7808
    },
    "carbonCrucibleWeights": [
      {
        "value": 11.7784,
        "min": 11.776,
        "max": 11.7808
      },
      {
        "value": 12.593,
        "min": 12.591,
        "max": 12.595
      },
      {
        "value": 11.354,
        "min": 11.352,
        "max": 11.356
      },
      {
        "value": 10.8573,
        "min": 10.3556,
        "max": 11.359
      }
    ],
    "carbonSampleWeight": {
      "value": 1.00055,
      "min": 1.0001,
      "max": 1.001
    },
    "carbonPercentage": {
      "value": 2.4000000000000004,
      "min": 2.2,
      "max": 2.6
    },
    "insideDiameter": {
      "value": 10.53,
      "min": 10.53,
      "max": 10.66
    },
    "wallThickness": {
      "value": 0.6,
      "min": 0.6,
      "max": 0.7
    },
    "declaredDischargePerPressure": [
      {
        "pressure": 0.5,
        "discharge": 0.85,
        "min": 0.77,
        "max": 0.94,
        "r3Min": 77,
        "r3Max": 79,
        "r12Min": 81,
        "r12Max": 83,
        "r13Min": 83,
        "r13Max": 85,
        "r23Min": 88,
        "r23Max": 94
      },
      {
        "pressure": 1,
        "discharge": 1.2,
        "min": 1.08,
        "max": 1.32,
        "r3Min": 108,
        "r3Max": 112,
        "r12Min": 118,
        "r12Max": 122,
        "r13Min": 118,
        "r13Max": 125,
        "r23Min": 128,
        "r23Max": 132
      },
      {
        "pressure": 1.5,
        "discharge": 1.5,
        "min": 1.35,
        "max": 1.65,
        "r3Min": 135,
        "r3Max": 140,
        "r12Min": 141,
        "r12Max": 145,
        "r13Min": 141,
        "r13Max": 148,
        "r23Min": 150,
        "r23Max": 161
      },
      {
        "pressure": 1.8,
        "discharge": 1.6,
        "min": 1.44,
        "max": 1.76,
        "r3Min": 144,
        "r3Max": 149,
        "r12Min": 150,
        "r12Max": 155,
        "r13Min": 150,
        "r13Max": 158,
        "r23Min": 161,
        "r23Max": 172
      }
    ],
    "spacings": [
      {
        "id": "07c7e628-a8a7-4af3-a4ba-15bd25fe2f7f",
        "value": 30,
        "min": 28.5,
        "max": 31.5
      },
      {
        "id": "2a096e51-1196-4c8e-ab91-b92b55e0c1e4",
        "value": 40,
        "min": 38,
        "max": 42
      },
      {
        "id": "271b9910-6655-4213-bc8d-fcc39ffe6b47",
        "value": 50,
        "min": 47.5,
        "max": 52.5
      },
      {
        "id": "d1576c8d-c571-4de7-878f-f7731f10579d",
        "value": 60,
        "min": 57,
        "max": 63
      }
    ]
  },
  {
    "id": "7e964b54-f67f-4f2a-8dc3-3bd48039ce78",
    "name": "12 mm, Class - 2, 2.0 LPH",
    "size": "12 mm",
    "className": "2",
    "category": "B, Unregulated",
    "discharge": 2,
    "minFlowPath": {
      "value": 0.8,
      "min": 0.8,
      "max": 1
    },
    "specimenLength": 240,
    "lengthBeforeTest": 150,
    "appliedLoad": 75,
    "carbonCrucibleWeight": {
      "value": 11.7784,
      "min": 11.776,
      "max": 11.7808
    },
    "carbonCrucibleWeights": [
      {
        "value": 11.7784,
        "min": 11.776,
        "max": 11.7808
      },
      {
        "value": 12.593,
        "min": 12.591,
        "max": 12.595
      },
      {
        "value": 11.354,
        "min": 11.352,
        "max": 11.356
      },
      {
        "value": 10.8573,
        "min": 10.3556,
        "max": 11.359
      }
    ],
    "carbonSampleWeight": {
      "value": 1.00055,
      "min": 1.0001,
      "max": 1.001
    },
    "carbonPercentage": {
      "value": 2.4000000000000004,
      "min": 2.2,
      "max": 2.6
    },
    "insideDiameter": {
      "value": 10.53,
      "min": 10.53,
      "max": 10.66
    },
    "wallThickness": {
      "value": 0.6,
      "min": 0.6,
      "max": 0.7
    },
    "declaredDischargePerPressure": [
      {
        "pressure": 0.5,
        "discharge": 1.43,
        "min": 1.29,
        "max": 1.57,
        "r3Min": 129,
        "r3Max": 133,
        "r12Min": 134,
        "r12Max": 138,
        "r13Min": 134,
        "r13Max": 140,
        "r23Min": 145,
        "r23Max": 152
      },
      {
        "pressure": 1,
        "discharge": 2,
        "min": 1.8,
        "max": 2.2,
        "r3Min": 180,
        "r3Max": 185,
        "r12Min": 186,
        "r12Max": 190,
        "r13Min": 186,
        "r13Max": 192,
        "r23Min": 199,
        "r23Max": 210
      },
      {
        "pressure": 1.5,
        "discharge": 2.39,
        "min": 2.15,
        "max": 2.63,
        "r3Min": 215,
        "r3Max": 220,
        "r12Min": 224,
        "r12Max": 230,
        "r13Min": 224,
        "r13Max": 230,
        "r23Min": 241,
        "r23Max": 255
      },
      {
        "pressure": 1.8,
        "discharge": 2.57,
        "min": 2.31,
        "max": 2.83,
        "r3Min": 233,
        "r3Max": 240,
        "r12Min": 250,
        "r12Max": 260,
        "r13Min": 250,
        "r13Max": 260,
        "r23Min": 265,
        "r23Max": 279
      }
    ],
    "spacings": [
      {
        "id": "35bac922-a96e-43f5-8df8-ea15e1232a1d",
        "value": 30,
        "min": 28.5,
        "max": 31.5
      },
      {
        "id": "250c1455-0732-4bd5-8bb7-cf54ba0d4ac2",
        "value": 40,
        "min": 38,
        "max": 42
      },
      {
        "id": "29817b78-5d1f-4463-a0f8-e9a5d9ca1f06",
        "value": 50,
        "min": 47.5,
        "max": 52.5
      },
      {
        "id": "30309a5c-bb17-4fd0-a189-f05cc60f7a0c",
        "value": 60,
        "min": 57,
        "max": 63
      }
    ]
  },
  {
    "id": "78f2417a-eb8e-480c-9902-9721550c18fd",
    "name": "12 mm, Class - 2, 3.00 LPH",
    "size": "12 mm",
    "className": "2",
    "category": "B, Unregulated",
    "discharge": 3,
    "minFlowPath": {
      "value": 0.8,
      "min": 0.8,
      "max": 1
    },
    "specimenLength": 240,
    "lengthBeforeTest": 150,
    "appliedLoad": 75,
    "carbonCrucibleWeight": {
      "value": 11.7784,
      "min": 11.776,
      "max": 11.7808
    },
    "carbonCrucibleWeights": [
      {
        "value": 11.7784,
        "min": 11.776,
        "max": 11.7808
      },
      {
        "value": 12.593,
        "min": 12.591,
        "max": 12.595
      },
      {
        "value": 11.354,
        "min": 11.352,
        "max": 11.356
      },
      {
        "value": 10.8573,
        "min": 10.3556,
        "max": 11.359
      }
    ],
    "carbonSampleWeight": {
      "value": 1.00055,
      "min": 1.0001,
      "max": 1.001
    },
    "carbonPercentage": {
      "value": 2.4000000000000004,
      "min": 2.2,
      "max": 2.6
    },
    "insideDiameter": {
      "value": 10.53,
      "min": 10.53,
      "max": 10.66
    },
    "wallThickness": {
      "value": 0.6,
      "min": 0.6,
      "max": 0.7
    },
    "declaredDischargePerPressure": [
      {
        "pressure": 0.5,
        "discharge": 2.25,
        "min": 2.03,
        "max": 2.48,
        "r3Min": 226,
        "r3Max": 231,
        "r12Min": 233,
        "r12Max": 238,
        "r13Min": 233,
        "r13Max": 238,
        "r23Min": 239,
        "r23Max": 248
      },
      {
        "pressure": 1,
        "discharge": 3,
        "min": 2.7,
        "max": 3.3,
        "r3Min": 272,
        "r3Max": 278,
        "r12Min": 288,
        "r12Max": 299,
        "r13Min": 288,
        "r13Max": 299,
        "r23Min": 310,
        "r23Max": 328
      },
      {
        "pressure": 1.5,
        "discharge": 3.7,
        "min": 3.33,
        "max": 4.07,
        "r3Min": 335,
        "r3Max": 345,
        "r12Min": 351,
        "r12Max": 361,
        "r13Min": 351,
        "r13Max": 361,
        "r23Min": 372,
        "r23Max": 382
      },
      {
        "pressure": 1.8,
        "discharge": 4,
        "min": 3.6,
        "max": 4.4,
        "r3Min": 365,
        "r3Max": 375,
        "r12Min": 388,
        "r12Max": 400,
        "r13Min": 388,
        "r13Max": 400,
        "r23Min": 415,
        "r23Max": 435
      }
    ],
    "spacings": [
      {
        "id": "788f6f7b-c866-444b-ba30-7bf00bd053e0",
        "value": 30,
        "min": 28.5,
        "max": 31.5
      },
      {
        "id": "4c05df04-977c-4818-bdfd-5fbf07e2975e",
        "value": 40,
        "min": 38,
        "max": 42
      },
      {
        "id": "e00bad5e-672b-4556-ba80-867de0f562b7",
        "value": 50,
        "min": 47.5,
        "max": 52.5
      },
      {
        "id": "77e4b81b-66d0-40bd-85d2-987d93fa7997",
        "value": 60,
        "min": 57,
        "max": 63
      }
    ]
  },
  {
    "id": "36351f4e-5497-4572-b1f0-52a9bde43e34",
    "name": "12 mm, Class - 2, 3.40 LPH",
    "size": "12 mm",
    "className": "2",
    "category": "B, Unregulated",
    "discharge": 3.4,
    "minFlowPath": {
      "value": 0.8,
      "min": 0.8,
      "max": 1
    },
    "specimenLength": 240,
    "lengthBeforeTest": 150,
    "appliedLoad": 75,
    "carbonCrucibleWeight": {
      "value": 11.7784,
      "min": 11.776,
      "max": 11.7808
    },
    "carbonCrucibleWeights": [
      {
        "value": 11.7784,
        "min": 11.776,
        "max": 11.7808
      },
      {
        "value": 12.593,
        "min": 12.591,
        "max": 12.595
      },
      {
        "value": 11.354,
        "min": 11.352,
        "max": 11.356
      },
      {
        "value": 10.8573,
        "min": 10.3556,
        "max": 11.359
      }
    ],
    "carbonSampleWeight": {
      "value": 1.00055,
      "min": 1.0001,
      "max": 1.001
    },
    "carbonPercentage": {
      "value": 2.4000000000000004,
      "min": 2.2,
      "max": 2.6
    },
    "insideDiameter": {
      "value": 10.53,
      "min": 10.53,
      "max": 10.66
    },
    "wallThickness": {
      "value": 0.6,
      "min": 0.6,
      "max": 0.7
    },
    "declaredDischargePerPressure": [
      {
        "pressure": 0.5,
        "discharge": 2.55,
        "min": 2.3,
        "max": 2.81,
        "r3Min": 233,
        "r3Max": 238,
        "r12Min": 245,
        "r12Max": 255,
        "r13Min": 245,
        "r13Max": 255,
        "r23Min": 261,
        "r23Max": 278
      },
      {
        "pressure": 1,
        "discharge": 3.4,
        "min": 3.06,
        "max": 3.74,
        "r3Min": 308,
        "r3Max": 315,
        "r12Min": 321,
        "r12Max": 335,
        "r13Min": 321,
        "r13Max": 335,
        "r23Min": 345,
        "r23Max": 366
      },
      {
        "pressure": 1.5,
        "discharge": 4.25,
        "min": 3.83,
        "max": 4.68,
        "r3Min": 385,
        "r3Max": 396,
        "r12Min": 410,
        "r12Max": 418,
        "r13Min": 410,
        "r13Max": 418,
        "r23Min": 435,
        "r23Max": 460
      },
      {
        "pressure": 1.8,
        "discharge": 4.7,
        "min": 4.23,
        "max": 5.17,
        "r3Min": 426,
        "r3Max": 440,
        "r12Min": 455,
        "r12Max": 468,
        "r13Min": 455,
        "r13Max": 468,
        "r23Min": 480,
        "r23Max": 510
      }
    ],
    "spacings": [
      {
        "id": "362daa22-08de-4971-a511-84dfb5237fac",
        "value": 30,
        "min": 28.5,
        "max": 31.5
      },
      {
        "id": "b37e20cd-5492-4262-8820-1e23593caa45",
        "value": 40,
        "min": 38,
        "max": 42
      },
      {
        "id": "af248cb4-0c56-418c-a049-b7944aae8f3f",
        "value": 50,
        "min": 47.5,
        "max": 52.5
      },
      {
        "id": "0c716f10-b6d3-4bda-90e1-c8b8ac4a930e",
        "value": 60,
        "min": 57,
        "max": 63
      }
    ]
  },
  {
    "id": "f9813948-c49b-49d3-a312-9f0ccd43a297",
    "name": "12 mm, Class - 2, 3.80 LPH",
    "size": "12 mm",
    "className": "2",
    "category": "B, Unregulated",
    "discharge": 3.8,
    "minFlowPath": {
      "value": 0.8,
      "min": 0.8,
      "max": 1
    },
    "specimenLength": 240,
    "lengthBeforeTest": 150,
    "appliedLoad": 75,
    "carbonCrucibleWeight": {
      "value": 11.7784,
      "min": 11.776,
      "max": 11.7808
    },
    "carbonCrucibleWeights": [
      {
        "value": 11.7784,
        "min": 11.776,
        "max": 11.7808
      },
      {
        "value": 12.593,
        "min": 12.591,
        "max": 12.595
      },
      {
        "value": 11.354,
        "min": 11.352,
        "max": 11.356
      },
      {
        "value": 10.8573,
        "min": 10.3556,
        "max": 11.359
      }
    ],
    "carbonSampleWeight": {
      "value": 1.00055,
      "min": 1.0001,
      "max": 1.001
    },
    "carbonPercentage": {
      "value": 2.4000000000000004,
      "min": 2.2,
      "max": 2.6
    },
    "insideDiameter": {
      "value": 10.53,
      "min": 10.53,
      "max": 10.66
    },
    "wallThickness": {
      "value": 0.6,
      "min": 0.6,
      "max": 0.7
    },
    "declaredDischargePerPressure": [
      {
        "pressure": 0.5,
        "discharge": 2.7,
        "min": 2.43,
        "max": 2.97,
        "r3Min": 244,
        "r3Max": 250,
        "r12Min": 261,
        "r12Max": 272,
        "r13Min": 261,
        "r13Max": 272,
        "r23Min": 278,
        "r23Max": 297
      },
      {
        "pressure": 1,
        "discharge": 3.8,
        "min": 3.42,
        "max": 4.18,
        "r3Min": 345,
        "r3Max": 355,
        "r12Min": 362,
        "r12Max": 378,
        "r13Min": 362,
        "r13Max": 378,
        "r23Min": 388,
        "r23Max": 410
      },
      {
        "pressure": 1.5,
        "discharge": 4.47,
        "min": 4.02,
        "max": 4.92,
        "r3Min": 405,
        "r3Max": 418,
        "r12Min": 425,
        "r12Max": 435,
        "r13Min": 425,
        "r13Max": 438,
        "r23Min": 458,
        "r23Max": 488
      },
      {
        "pressure": 1.8,
        "discharge": 4.78,
        "min": 4.3,
        "max": 5.26,
        "r3Min": 433,
        "r3Max": 447,
        "r12Min": 461,
        "r12Max": 478,
        "r13Min": 461,
        "r13Max": 478,
        "r23Min": 491,
        "r23Max": 520
      }
    ],
    "spacings": [
      {
        "id": "7efdcecc-ab1b-46e9-b742-51d8b1930cea",
        "value": 30,
        "min": 28.5,
        "max": 31.5
      },
      {
        "id": "664a8947-1a2d-4dfd-a60e-3a17d7ece677",
        "value": 40,
        "min": 38,
        "max": 42
      },
      {
        "id": "73e4da17-2e8a-40ff-a10f-bd5297cc216c",
        "value": 50,
        "min": 47.5,
        "max": 52.5
      },
      {
        "id": "a89ab869-9092-4093-b083-3f7f56600599",
        "value": 60,
        "min": 57,
        "max": 63
      }
    ]
  },
  {
    "id": "9b1a7b5c-fdb8-4229-92a0-a1584ae44f4f",
    "name": "16 mm, Class - 2, 2.0 LPH",
    "size": "16 mm",
    "className": "2",
    "category": "B, Unregulated",
    "discharge": 2,
    "minFlowPath": {
      "value": 0.8,
      "min": 0.8,
      "max": 1
    },
    "specimenLength": 320,
    "lengthBeforeTest": 150,
    "appliedLoad": 120,
    "carbonCrucibleWeight": {
      "value": 11.7786,
      "min": 11.7762,
      "max": 11.781
    },
    "carbonCrucibleWeights": [
      {
        "value": 11.7786,
        "min": 11.7762,
        "max": 11.781
      },
      {
        "value": 12.59315,
        "min": 12.591,
        "max": 12.5953
      },
      {
        "value": 11.353,
        "min": 11.3505,
        "max": 11.3555
      },
      {
        "value": 10.35775,
        "min": 10.355,
        "max": 10.3605
      }
    ],
    "carbonSampleWeight": {
      "value": 1.0005,
      "min": 1,
      "max": 1.001
    },
    "carbonPercentage": {
      "value": 2.425,
      "min": 2.2,
      "max": 2.65
    },
    "insideDiameter": {
      "value": 14.23,
      "min": 14.23,
      "max": 14.35
    },
    "wallThickness": {
      "value": 0.75,
      "min": 0.75,
      "max": 0.85
    },
    "declaredDischargePerPressure": [
      {
        "pressure": 0.5,
        "discharge": 1.4,
        "min": 1.26,
        "max": 1.54,
        "r3Min": 126,
        "r3Max": 131,
        "r12Min": 135,
        "r12Max": 140,
        "r13Min": 135,
        "r13Max": 140,
        "r23Min": 142,
        "r23Max": 154
      },
      {
        "pressure": 1,
        "discharge": 2,
        "min": 1.8,
        "max": 2.2,
        "r3Min": 180,
        "r3Max": 188,
        "r12Min": 191,
        "r12Max": 199,
        "r13Min": 191,
        "r13Max": 199,
        "r23Min": 203,
        "r23Max": 220
      },
      {
        "pressure": 1.5,
        "discharge": 2.3,
        "min": 2.07,
        "max": 2.53,
        "r3Min": 207,
        "r3Max": 213,
        "r12Min": 220,
        "r12Max": 228,
        "r13Min": 220,
        "r13Max": 228,
        "r23Min": 235,
        "r23Max": 248
      },
      {
        "pressure": 1.8,
        "discharge": 2.6,
        "min": 2.34,
        "max": 2.86,
        "r3Min": 235,
        "r3Max": 245,
        "r12Min": 251,
        "r12Max": 260,
        "r13Min": 251,
        "r13Max": 260,
        "r23Min": 266,
        "r23Max": 286
      }
    ],
    "spacings": [
      {
        "id": "649c3e92-48f6-4bc3-9085-927a4f1eaa8e",
        "value": 30,
        "min": 28.5,
        "max": 31.5
      },
      {
        "id": "18739ef6-1f79-4173-a339-59d0d71d7dd8",
        "value": 40,
        "min": 38,
        "max": 42
      },
      {
        "id": "b98979aa-e652-47c1-a677-24a9973d2d78",
        "value": 50,
        "min": 47.5,
        "max": 52.5
      },
      {
        "id": "241dfddb-e065-4f4f-a02f-814a199b8edb",
        "value": 60,
        "min": 57,
        "max": 63
      }
    ]
  },
  {
    "id": "89aa99fe-fd2d-4c5a-a0e8-3d48e461d9ba",
    "name": "16 mm, Class - 2, 1.20 LPH",
    "size": "16 mm",
    "className": "2",
    "category": "B, Unregulated",
    "discharge": 1.2,
    "minFlowPath": {
      "value": 0.6,
      "min": 0.6,
      "max": 0.85
    },
    "specimenLength": 320,
    "lengthBeforeTest": 150,
    "appliedLoad": 120,
    "carbonCrucibleWeight": {
      "value": 11.7784,
      "min": 11.776,
      "max": 11.7808
    },
    "carbonCrucibleWeights": [
      {
        "value": 11.7784,
        "min": 11.776,
        "max": 11.7808
      },
      {
        "value": 12.593,
        "min": 12.591,
        "max": 12.595
      },
      {
        "value": 11.354,
        "min": 11.352,
        "max": 11.356
      },
      {
        "value": 10.8573,
        "min": 10.3556,
        "max": 11.359
      }
    ],
    "carbonSampleWeight": {
      "value": 1.00055,
      "min": 1.0001,
      "max": 1.001
    },
    "carbonPercentage": {
      "value": 2.4000000000000004,
      "min": 2.2,
      "max": 2.6
    },
    "insideDiameter": {
      "value": 10.53,
      "min": 10.53,
      "max": 10.66
    },
    "wallThickness": {
      "value": 0.6,
      "min": 0.6,
      "max": 0.7
    },
    "declaredDischargePerPressure": [
      {
        "pressure": 0.5,
        "discharge": 0.85,
        "min": 0.77,
        "max": 0.94,
        "r3Min": 77,
        "r3Max": 79,
        "r12Min": 81,
        "r12Max": 83,
        "r13Min": 83,
        "r13Max": 85,
        "r23Min": 88,
        "r23Max": 94
      },
      {
        "pressure": 1,
        "discharge": 1.2,
        "min": 1.08,
        "max": 1.32,
        "r3Min": 108,
        "r3Max": 112,
        "r12Min": 118,
        "r12Max": 122,
        "r13Min": 118,
        "r13Max": 125,
        "r23Min": 128,
        "r23Max": 132
      },
      {
        "pressure": 1.5,
        "discharge": 1.5,
        "min": 1.35,
        "max": 1.65,
        "r3Min": 135,
        "r3Max": 140,
        "r12Min": 141,
        "r12Max": 145,
        "r13Min": 141,
        "r13Max": 148,
        "r23Min": 150,
        "r23Max": 161
      },
      {
        "pressure": 1.8,
        "discharge": 1.6,
        "min": 1.44,
        "max": 1.76,
        "r3Min": 144,
        "r3Max": 149,
        "r12Min": 150,
        "r12Max": 155,
        "r13Min": 150,
        "r13Max": 158,
        "r23Min": 161,
        "r23Max": 172
      }
    ],
    "spacings": [
      {
        "id": "8f70066f-b059-480a-a1ca-8fab71073f4e",
        "value": 30,
        "min": 28.5,
        "max": 31.5
      },
      {
        "id": "f13f4587-2ab2-4033-a3f1-934cf52ce61c",
        "value": 40,
        "min": 38,
        "max": 42
      },
      {
        "id": "522c2bd7-9520-4c75-9080-bc79d9f9022c",
        "value": 50,
        "min": 47.5,
        "max": 52.5
      },
      {
        "id": "bb1be4a8-bf15-4d86-8d33-45f7eec1b523",
        "value": 60,
        "min": 57,
        "max": 63
      }
    ]
  },
  {
    "id": "140e4b65-ab5c-4498-aa2f-88f34d395248",
    "name": "16 mm, Class - 2, 3.00 LPH",
    "size": "16 mm",
    "className": "2",
    "category": "B, Unregulated",
    "discharge": 3,
    "minFlowPath": {
      "value": 0.8,
      "min": 0.8,
      "max": 1
    },
    "specimenLength": 320,
    "lengthBeforeTest": 150,
    "appliedLoad": 120,
    "carbonCrucibleWeight": {
      "value": 11.7784,
      "min": 11.776,
      "max": 11.7808
    },
    "carbonCrucibleWeights": [
      {
        "value": 11.7784,
        "min": 11.776,
        "max": 11.7808
      },
      {
        "value": 12.593,
        "min": 12.591,
        "max": 12.595
      },
      {
        "value": 11.354,
        "min": 11.352,
        "max": 11.356
      },
      {
        "value": 10.8573,
        "min": 10.3556,
        "max": 11.359
      }
    ],
    "carbonSampleWeight": {
      "value": 1.00055,
      "min": 1.0001,
      "max": 1.001
    },
    "carbonPercentage": {
      "value": 2.4000000000000004,
      "min": 2.2,
      "max": 2.6
    },
    "insideDiameter": {
      "value": 14.23,
      "min": 14.23,
      "max": 14.35
    },
    "wallThickness": {
      "value": 0.75,
      "min": 0.75,
      "max": 0.86
    },
    "declaredDischargePerPressure": [
      {
        "pressure": 0.5,
        "discharge": 2.25,
        "min": 2.03,
        "max": 2.48,
        "r3Min": 226,
        "r3Max": 231,
        "r12Min": 233,
        "r12Max": 238,
        "r13Min": 233,
        "r13Max": 238,
        "r23Min": 239,
        "r23Max": 248
      },
      {
        "pressure": 1,
        "discharge": 3,
        "min": 2.7,
        "max": 3.3,
        "r3Min": 272,
        "r3Max": 278,
        "r12Min": 288,
        "r12Max": 299,
        "r13Min": 288,
        "r13Max": 299,
        "r23Min": 310,
        "r23Max": 328
      },
      {
        "pressure": 1.5,
        "discharge": 3.7,
        "min": 3.33,
        "max": 4.07,
        "r3Min": 335,
        "r3Max": 345,
        "r12Min": 351,
        "r12Max": 361,
        "r13Min": 351,
        "r13Max": 361,
        "r23Min": 372,
        "r23Max": 382
      },
      {
        "pressure": 1.8,
        "discharge": 4,
        "min": 3.6,
        "max": 4.4,
        "r3Min": 365,
        "r3Max": 375,
        "r12Min": 388,
        "r12Max": 400,
        "r13Min": 388,
        "r13Max": 400,
        "r23Min": 415,
        "r23Max": 435
      }
    ],
    "spacings": [
      {
        "id": "febb21d7-7cfd-43ee-a222-164aa43e1e5d",
        "value": 30,
        "min": 28.5,
        "max": 31.5
      },
      {
        "id": "88976853-5050-4711-a76d-724dce1e01fe",
        "value": 40,
        "min": 38,
        "max": 42
      },
      {
        "id": "9b9cf643-d7d2-488b-a4b0-e3b956ea579c",
        "value": 50,
        "min": 47.5,
        "max": 52.5
      },
      {
        "id": "fbdf8312-ab9f-4970-88ee-3bd73eb7515b",
        "value": 60,
        "min": 57,
        "max": 63
      }
    ]
  },
  {
    "id": "276d43af-c0dd-446e-a0a7-00ab734c33db",
    "name": "16 mm, Class - 2, 3.40 LPH",
    "size": "12 mm",
    "className": "2",
    "category": "B, Unregulated",
    "discharge": 3.4,
    "minFlowPath": {
      "value": 0.8,
      "min": 0.8,
      "max": 1
    },
    "specimenLength": 240,
    "lengthBeforeTest": 150,
    "appliedLoad": 120,
    "carbonCrucibleWeight": {
      "value": 11.7784,
      "min": 11.776,
      "max": 11.7808
    },
    "carbonCrucibleWeights": [
      {
        "value": 11.7784,
        "min": 11.776,
        "max": 11.7808
      },
      {
        "value": 12.593,
        "min": 12.591,
        "max": 12.595
      },
      {
        "value": 11.354,
        "min": 11.352,
        "max": 11.356
      },
      {
        "value": 10.8573,
        "min": 10.3556,
        "max": 11.359
      }
    ],
    "carbonSampleWeight": {
      "value": 1.00055,
      "min": 1.0001,
      "max": 1.001
    },
    "carbonPercentage": {
      "value": 2.4000000000000004,
      "min": 2.2,
      "max": 2.6
    },
    "insideDiameter": {
      "value": 10.53,
      "min": 10.53,
      "max": 10.66
    },
    "wallThickness": {
      "value": 0.6,
      "min": 0.6,
      "max": 0.7
    },
    "declaredDischargePerPressure": [
      {
        "pressure": 0.5,
        "discharge": 2.55,
        "min": 2.3,
        "max": 2.81,
        "r3Min": 233,
        "r3Max": 238,
        "r12Min": 245,
        "r12Max": 255,
        "r13Min": 245,
        "r13Max": 255,
        "r23Min": 261,
        "r23Max": 278
      },
      {
        "pressure": 1,
        "discharge": 3.4,
        "min": 3.06,
        "max": 3.74,
        "r3Min": 308,
        "r3Max": 315,
        "r12Min": 321,
        "r12Max": 335,
        "r13Min": 321,
        "r13Max": 335,
        "r23Min": 345,
        "r23Max": 366
      },
      {
        "pressure": 1.5,
        "discharge": 4.25,
        "min": 3.83,
        "max": 4.68,
        "r3Min": 385,
        "r3Max": 396,
        "r12Min": 410,
        "r12Max": 418,
        "r13Min": 410,
        "r13Max": 418,
        "r23Min": 435,
        "r23Max": 460
      },
      {
        "pressure": 1.8,
        "discharge": 4.7,
        "min": 4.23,
        "max": 5.17,
        "r3Min": 426,
        "r3Max": 440,
        "r12Min": 455,
        "r12Max": 468,
        "r13Min": 455,
        "r13Max": 468,
        "r23Min": 480,
        "r23Max": 510
      }
    ],
    "spacings": [
      {
        "id": "1f0a7428-89d4-4ece-841f-3b6e2a3aabac",
        "value": 30,
        "min": 28.5,
        "max": 31.5
      },
      {
        "id": "1fca4227-fc71-40a7-9fe3-567aa9656b3c",
        "value": 40,
        "min": 38,
        "max": 42
      },
      {
        "id": "495d9ef9-e8ae-47c4-bfa4-3db05a66e154",
        "value": 50,
        "min": 47.5,
        "max": 52.5
      },
      {
        "id": "9a7263d6-2bf2-4e97-b4ca-bcc9d4a2d61b",
        "value": 60,
        "min": 57,
        "max": 63
      }
    ]
  },
  {
    "id": "274159b0-3675-4c7a-9476-99e83e646a29",
    "name": "16 mm, Class - 2, 3.80 LPH",
    "size": "16 mm",
    "className": "2",
    "category": "B, Unregulated",
    "discharge": 3.8,
    "minFlowPath": {
      "value": 1,
      "min": 1,
      "max": 1.15
    },
    "specimenLength": 320,
    "lengthBeforeTest": 150,
    "appliedLoad": 120,
    "carbonCrucibleWeight": {
      "value": 11.7784,
      "min": 11.776,
      "max": 11.7808
    },
    "carbonCrucibleWeights": [
      {
        "value": 11.7784,
        "min": 11.776,
        "max": 11.7808
      },
      {
        "value": 12.593,
        "min": 12.591,
        "max": 12.595
      },
      {
        "value": 11.354,
        "min": 11.352,
        "max": 11.356
      },
      {
        "value": 10.8573,
        "min": 10.3556,
        "max": 11.359
      }
    ],
    "carbonSampleWeight": {
      "value": 1.00055,
      "min": 1.0001,
      "max": 1.001
    },
    "carbonPercentage": {
      "value": 2.4000000000000004,
      "min": 2.2,
      "max": 2.6
    },
    "insideDiameter": {
      "value": 14.25,
      "min": 14.25,
      "max": 14.38
    },
    "wallThickness": {
      "value": 0.74,
      "min": 0.74,
      "max": 0.86
    },
    "declaredDischargePerPressure": [
      {
        "pressure": 0.5,
        "discharge": 2.7,
        "min": 2.43,
        "max": 2.97,
        "r3Min": 244,
        "r3Max": 250,
        "r12Min": 261,
        "r12Max": 272,
        "r13Min": 261,
        "r13Max": 272,
        "r23Min": 278,
        "r23Max": 297
      },
      {
        "pressure": 1,
        "discharge": 3.8,
        "min": 3.42,
        "max": 4.18,
        "r3Min": 345,
        "r3Max": 355,
        "r12Min": 362,
        "r12Max": 378,
        "r13Min": 362,
        "r13Max": 378,
        "r23Min": 388,
        "r23Max": 410
      },
      {
        "pressure": 1.5,
        "discharge": 4.7,
        "min": 4.23,
        "max": 5.17,
        "r3Min": 425,
        "r3Max": 433,
        "r12Min": 451,
        "r12Max": 462,
        "r13Min": 451,
        "r13Max": 462,
        "r23Min": 470,
        "r23Max": 500
      },
      {
        "pressure": 1.8,
        "discharge": 5.2,
        "min": 4.68,
        "max": 5.72,
        "r3Min": 470,
        "r3Max": 482,
        "r12Min": 499,
        "r12Max": 512,
        "r13Min": 499,
        "r13Max": 512,
        "r23Min": 530,
        "r23Max": 550
      }
    ],
    "spacings": [
      {
        "id": "4eb676d6-b773-4fdc-8feb-63e48b7b8513",
        "value": 30,
        "min": 28.5,
        "max": 31.5
      },
      {
        "id": "dad19f9b-4b13-455e-9c11-676cc91a94b1",
        "value": 40,
        "min": 38,
        "max": 42
      },
      {
        "id": "c26f70fe-2db7-4d7e-949f-9c6bed73faf9",
        "value": 50,
        "min": 47.5,
        "max": 52.5
      },
      {
        "id": "d1108cfc-6d9d-4c3c-975b-2c0176b459f6",
        "value": 60,
        "min": 57,
        "max": 63
      }
    ]
  },
  {
    "id": "11d9e1b4-d747-4f10-bf16-448dfa9623d2",
    "name": "20 mm, Class - 1, 1.20 LPH",
    "size": "20 mm",
    "className": "1",
    "category": "B, Unregulated",
    "discharge": 1.2,
    "minFlowPath": {
      "value": 0.6,
      "min": 0.6,
      "max": 0.85
    },
    "specimenLength": 400,
    "lengthBeforeTest": 150,
    "appliedLoad": 150,
    "carbonCrucibleWeight": {
      "value": 11.7784,
      "min": 11.776,
      "max": 11.7808
    },
    "carbonCrucibleWeights": [
      {
        "value": 11.7784,
        "min": 11.776,
        "max": 11.7808
      },
      {
        "value": 12.593,
        "min": 12.591,
        "max": 12.595
      },
      {
        "value": 11.354,
        "min": 11.352,
        "max": 11.356
      },
      {
        "value": 10.8573,
        "min": 10.3556,
        "max": 11.359
      }
    ],
    "carbonSampleWeight": {
      "value": 1.00055,
      "min": 1.0001,
      "max": 1.001
    },
    "carbonPercentage": {
      "value": 2.4000000000000004,
      "min": 2.2,
      "max": 2.6
    },
    "insideDiameter": {
      "value": 18.03,
      "min": 18.03,
      "max": 18.18
    },
    "wallThickness": {
      "value": 0.7,
      "min": 0.7,
      "max": 0.8
    },
    "declaredDischargePerPressure": [
      {
        "pressure": 0.5,
        "discharge": 0.85,
        "min": 0.77,
        "max": 0.94,
        "r3Min": 77,
        "r3Max": 79,
        "r12Min": 81,
        "r12Max": 83,
        "r13Min": 83,
        "r13Max": 85,
        "r23Min": 88,
        "r23Max": 94
      },
      {
        "pressure": 1,
        "discharge": 1.2,
        "min": 1.08,
        "max": 1.32,
        "r3Min": 108,
        "r3Max": 112,
        "r12Min": 118,
        "r12Max": 122,
        "r13Min": 118,
        "r13Max": 125,
        "r23Min": 128,
        "r23Max": 132
      },
      {
        "pressure": 1.5,
        "discharge": 1.5,
        "min": 1.35,
        "max": 1.65,
        "r3Min": 135,
        "r3Max": 140,
        "r12Min": 141,
        "r12Max": 145,
        "r13Min": 141,
        "r13Max": 148,
        "r23Min": 150,
        "r23Max": 161
      },
      {
        "pressure": 1.8,
        "discharge": 1.6,
        "min": 1.44,
        "max": 1.76,
        "r3Min": 144,
        "r3Max": 149,
        "r12Min": 150,
        "r12Max": 155,
        "r13Min": 150,
        "r13Max": 158,
        "r23Min": 161,
        "r23Max": 172
      }
    ],
    "spacings": [
      {
        "id": "52cf4dd9-0a58-4a98-9b34-286948a743a5",
        "value": 30,
        "min": 28.5,
        "max": 31.5
      },
      {
        "id": "2a9a0dec-13c2-4c84-b472-487845db4bc3",
        "value": 40,
        "min": 38,
        "max": 42
      },
      {
        "id": "d571782d-0b24-4f21-b04d-c4b1c1c4da23",
        "value": 50,
        "min": 47.5,
        "max": 52.5
      },
      {
        "id": "13246882-4453-464f-a81b-94d7dffbd656",
        "value": 60,
        "min": 57,
        "max": 63
      }
    ]
  },
  {
    "id": "e44053e4-6b6a-4e4c-89f0-143a671de514",
    "name": "20 mm, Class - 1, 2.00 LPH",
    "size": "20 mm",
    "className": "1",
    "category": "B, Unregulated",
    "discharge": 2,
    "minFlowPath": {
      "value": 0.6,
      "min": 0.6,
      "max": 0.85
    },
    "specimenLength": 400,
    "lengthBeforeTest": 150,
    "appliedLoad": 150,
    "carbonCrucibleWeight": {
      "value": 11.7784,
      "min": 11.776,
      "max": 11.7808
    },
    "carbonCrucibleWeights": [
      {
        "value": 11.7784,
        "min": 11.776,
        "max": 11.7808
      },
      {
        "value": 12.593,
        "min": 12.591,
        "max": 12.595
      },
      {
        "value": 11.354,
        "min": 11.352,
        "max": 11.356
      },
      {
        "value": 10.8573,
        "min": 10.3556,
        "max": 11.359
      }
    ],
    "carbonSampleWeight": {
      "value": 1.00055,
      "min": 1.0001,
      "max": 1.001
    },
    "carbonPercentage": {
      "value": 2.4000000000000004,
      "min": 2.2,
      "max": 2.6
    },
    "insideDiameter": {
      "value": 18.03,
      "min": 18.03,
      "max": 18.18
    },
    "wallThickness": {
      "value": 0.7,
      "min": 0.7,
      "max": 0.8
    },
    "declaredDischargePerPressure": [
      {
        "pressure": 0.5,
        "discharge": 1.26,
        "min": 1.13,
        "max": 1.39,
        "r3Min": 113,
        "r3Max": 117,
        "r12Min": 121,
        "r12Max": 125,
        "r13Min": 121,
        "r13Max": 125,
        "r23Min": 128,
        "r23Max": 138
      },
      {
        "pressure": 1,
        "discharge": 2,
        "min": 1.8,
        "max": 2.2,
        "r3Min": 181,
        "r3Max": 188,
        "r12Min": 195,
        "r12Max": 200,
        "r13Min": 195,
        "r13Max": 200,
        "r23Min": 205,
        "r23Max": 220
      },
      {
        "pressure": 1.5,
        "discharge": 2.82,
        "min": 2.54,
        "max": 3.1,
        "r3Min": 256,
        "r3Max": 266,
        "r12Min": 278,
        "r12Max": 282,
        "r13Min": 278,
        "r13Max": 282,
        "r23Min": 290,
        "r23Max": 310
      },
      {
        "pressure": 1.8,
        "discharge": 3.3,
        "min": 2.97,
        "max": 3.63,
        "r3Min": 297,
        "r3Max": 310,
        "r12Min": 319,
        "r12Max": 330,
        "r13Min": 319,
        "r13Max": 330,
        "r23Min": 344,
        "r23Max": 360
      }
    ],
    "spacings": [
      {
        "id": "0cb94754-58f1-4be0-a2b4-4243e8b1b0df",
        "value": 30,
        "min": 28.5,
        "max": 31.5
      },
      {
        "id": "56bb394d-0933-4b86-8315-559e109f15c3",
        "value": 40,
        "min": 38,
        "max": 42
      },
      {
        "id": "45cb8810-e466-4cef-8bdc-56c11352863f",
        "value": 50,
        "min": 47.5,
        "max": 52.5
      },
      {
        "id": "3a03c04d-9a34-406b-a2cc-487617993cde",
        "value": 60,
        "min": 57,
        "max": 63
      }
    ]
  },
  {
    "id": "5b421e56-30ca-4abf-bf0c-11ff6a37e0d1",
    "name": "20 mm, Class - 1, 3.00 LPH",
    "size": "20 mm",
    "className": "1",
    "category": "B, Unregulated",
    "discharge": 3,
    "minFlowPath": {
      "value": 0.8,
      "min": 0.8,
      "max": 1
    },
    "specimenLength": 400,
    "lengthBeforeTest": 150,
    "appliedLoad": 150,
    "carbonCrucibleWeight": {
      "value": 11.7784,
      "min": 11.776,
      "max": 11.7808
    },
    "carbonCrucibleWeights": [
      {
        "value": 11.7784,
        "min": 11.776,
        "max": 11.7808
      },
      {
        "value": 12.593,
        "min": 12.591,
        "max": 12.595
      },
      {
        "value": 11.354,
        "min": 11.352,
        "max": 11.356
      },
      {
        "value": 10.8573,
        "min": 10.3556,
        "max": 11.359
      }
    ],
    "carbonSampleWeight": {
      "value": 1.00055,
      "min": 1.0001,
      "max": 1.001
    },
    "carbonPercentage": {
      "value": 2.4000000000000004,
      "min": 2.2,
      "max": 2.6
    },
    "insideDiameter": {
      "value": 18.03,
      "min": 18.03,
      "max": 18.18
    },
    "wallThickness": {
      "value": 0.7,
      "min": 0.7,
      "max": 0.8
    },
    "declaredDischargePerPressure": [
      {
        "pressure": 0.5,
        "discharge": 2.25,
        "min": 2.03,
        "max": 2.48,
        "r3Min": 205,
        "r3Max": 211,
        "r12Min": 219,
        "r12Max": 225,
        "r13Min": 219,
        "r13Max": 225,
        "r23Min": 233,
        "r23Max": 245
      },
      {
        "pressure": 1,
        "discharge": 3,
        "min": 2.7,
        "max": 3.3,
        "r3Min": 272,
        "r3Max": 278,
        "r12Min": 289,
        "r12Max": 295,
        "r13Min": 289,
        "r13Max": 295,
        "r23Min": 310,
        "r23Max": 330
      },
      {
        "pressure": 1.5,
        "discharge": 3.7,
        "min": 3.33,
        "max": 4.07,
        "r3Min": 335,
        "r3Max": 342,
        "r12Min": 350,
        "r12Max": 368,
        "r13Min": 350,
        "r13Max": 368,
        "r23Min": 379,
        "r23Max": 395
      },
      {
        "pressure": 1.8,
        "discharge": 4,
        "min": 3.6,
        "max": 4.4,
        "r3Min": 360,
        "r3Max": 370,
        "r12Min": 385,
        "r12Max": 392,
        "r13Min": 385,
        "r13Max": 392,
        "r23Min": 405,
        "r23Max": 435
      }
    ],
    "spacings": [
      {
        "id": "80d0367a-dcf7-4c57-85c0-23c4f6bb8e78",
        "value": 30,
        "min": 28.5,
        "max": 31.5
      },
      {
        "id": "812e2e0b-7fbb-4229-916b-56c7c9adba65",
        "value": 40,
        "min": 38,
        "max": 42
      },
      {
        "id": "62acfb7b-1c6e-413c-8dfb-bb52107ee494",
        "value": 50,
        "min": 47.5,
        "max": 52.5
      },
      {
        "id": "d460f47c-2fbf-4c1e-81dc-6aca36dd59f5",
        "value": 60,
        "min": 57,
        "max": 63
      }
    ]
  },
  {
    "id": "1784b500-dc86-4e15-a79e-546ed56611ff",
    "name": "20 mm, Class - 1, 3.40 LPH",
    "size": "20 mm",
    "className": "1",
    "category": "B, Unregulated",
    "discharge": 3.4,
    "minFlowPath": {
      "value": 0.8,
      "min": 0.8,
      "max": 1
    },
    "specimenLength": 400,
    "lengthBeforeTest": 150,
    "appliedLoad": 150,
    "carbonCrucibleWeight": {
      "value": 11.7784,
      "min": 11.776,
      "max": 11.7808
    },
    "carbonCrucibleWeights": [
      {
        "value": 11.7784,
        "min": 11.776,
        "max": 11.7808
      },
      {
        "value": 12.593,
        "min": 12.591,
        "max": 12.595
      },
      {
        "value": 11.354,
        "min": 11.352,
        "max": 11.356
      },
      {
        "value": 10.8573,
        "min": 10.3556,
        "max": 11.359
      }
    ],
    "carbonSampleWeight": {
      "value": 1.00055,
      "min": 1.0001,
      "max": 1.001
    },
    "carbonPercentage": {
      "value": 2.4000000000000004,
      "min": 2.2,
      "max": 2.6
    },
    "insideDiameter": {
      "value": 18.03,
      "min": 18.03,
      "max": 18.18
    },
    "wallThickness": {
      "value": 0.7,
      "min": 0.7,
      "max": 0.8
    },
    "declaredDischargePerPressure": [
      {
        "pressure": 0.5,
        "discharge": 2.4,
        "min": 2.16,
        "max": 2.64,
        "r3Min": 216,
        "r3Max": 228,
        "r12Min": 233,
        "r12Max": 240,
        "r13Min": 233,
        "r13Max": 240,
        "r23Min": 251,
        "r23Max": 264
      },
      {
        "pressure": 1,
        "discharge": 3.4,
        "min": 3.06,
        "max": 3.74,
        "r3Min": 307,
        "r3Max": 317,
        "r12Min": 325,
        "r12Max": 335,
        "r13Min": 325,
        "r13Max": 335,
        "r23Min": 349,
        "r23Max": 365
      },
      {
        "pressure": 1.5,
        "discharge": 4,
        "min": 3.6,
        "max": 4.4,
        "r3Min": 360,
        "r3Max": 370,
        "r12Min": 385,
        "r12Max": 392,
        "r13Min": 385,
        "r13Max": 392,
        "r23Min": 405,
        "r23Max": 435
      },
      {
        "pressure": 1.8,
        "discharge": 4.4,
        "min": 4.01,
        "max": 4.9,
        "r3Min": 405,
        "r3Max": 420,
        "r12Min": 431,
        "r12Max": 439,
        "r13Min": 431,
        "r13Max": 439,
        "r23Min": 455,
        "r23Max": 480
      }
    ],
    "spacings": [
      {
        "id": "552371de-b96d-489b-bf1f-13415b6e7766",
        "value": 30,
        "min": 28.5,
        "max": 31.5
      },
      {
        "id": "e97cb5d5-1b5a-480f-be31-ffd44ce31e60",
        "value": 40,
        "min": 38,
        "max": 42
      },
      {
        "id": "845f79f7-4d46-4322-b016-c7fabfe90be5",
        "value": 50,
        "min": 47.5,
        "max": 52.5
      },
      {
        "id": "94538b86-ee1f-4bf1-be43-b7ce252ec9cd",
        "value": 60,
        "min": 57,
        "max": 63
      }
    ]
  },
  {
    "id": "b539a9ff-4cbb-4271-ac7c-a9593d2546d4",
    "name": "20 mm, Class - 1, 4.00 LPH",
    "size": "20 mm",
    "className": "1",
    "category": "B, Unregulated",
    "discharge": 4,
    "minFlowPath": {
      "value": 0.8,
      "min": 0.8,
      "max": 1
    },
    "specimenLength": 400,
    "lengthBeforeTest": 150,
    "appliedLoad": 150,
    "carbonCrucibleWeight": {
      "value": 11.7784,
      "min": 11.776,
      "max": 11.7808
    },
    "carbonCrucibleWeights": [
      {
        "value": 11.7784,
        "min": 11.776,
        "max": 11.7808
      },
      {
        "value": 12.593,
        "min": 12.591,
        "max": 12.595
      },
      {
        "value": 11.354,
        "min": 11.352,
        "max": 11.356
      },
      {
        "value": 10.8573,
        "min": 10.3556,
        "max": 11.359
      }
    ],
    "carbonSampleWeight": {
      "value": 1.00055,
      "min": 1.0001,
      "max": 1.001
    },
    "carbonPercentage": {
      "value": 2.4000000000000004,
      "min": 2.2,
      "max": 2.6
    },
    "insideDiameter": {
      "value": 18.03,
      "min": 18.03,
      "max": 18.18
    },
    "wallThickness": {
      "value": 0.7,
      "min": 0.7,
      "max": 0.8
    },
    "declaredDischargePerPressure": [
      {
        "pressure": 0.5,
        "discharge": 3.24,
        "min": 2.92,
        "max": 3.56,
        "r3Min": 292,
        "r3Max": 300,
        "r12Min": 315,
        "r12Max": 320,
        "r13Min": 315,
        "r13Max": 320,
        "r23Min": 332,
        "r23Max": 356
      },
      {
        "pressure": 1,
        "discharge": 4,
        "min": 3.6,
        "max": 4.4,
        "r3Min": 363,
        "r3Max": 380,
        "r12Min": 399,
        "r12Max": 408,
        "r13Min": 399,
        "r13Max": 408,
        "r23Min": 421,
        "r23Max": 440
      },
      {
        "pressure": 1.5,
        "discharge": 4.86,
        "min": 4.37,
        "max": 5.35,
        "r3Min": 437,
        "r3Max": 450,
        "r12Min": 468,
        "r12Max": 475,
        "r13Min": 468,
        "r13Max": 475,
        "r23Min": 495,
        "r23Max": 520
      },
      {
        "pressure": 1.8,
        "discharge": 5.4,
        "min": 4.86,
        "max": 5.94,
        "r3Min": 486,
        "r3Max": 500,
        "r12Min": 525,
        "r12Max": 532,
        "r13Min": 525,
        "r13Max": 532,
        "r23Min": 558,
        "r23Max": 579
      }
    ],
    "spacings": [
      {
        "id": "93ffaf3f-b2ac-4ad3-a7a7-43e40473518d",
        "value": 30,
        "min": 28.5,
        "max": 31.5
      },
      {
        "id": "b519e58c-6873-4e46-98c5-1782c64ed6cd",
        "value": 40,
        "min": 38,
        "max": 42
      },
      {
        "id": "dad66e7c-ce54-4796-8c9a-fce42eb8051a",
        "value": 50,
        "min": 47.5,
        "max": 52.5
      },
      {
        "id": "69e56bf6-a1a0-4f6d-8829-659e486a308f",
        "value": 60,
        "min": 57,
        "max": 63
      }
    ]
  },
  {
    "id": "3a75a5ae-5df3-4bf4-9564-2a895587343a",
    "name": "16 mm, Class - 1, 2.00 LPH",
    "size": "16 mm",
    "className": "1",
    "category": "B, Unregulated",
    "discharge": 2,
    "minFlowPath": {
      "value": 0.7,
      "min": 0.7,
      "max": 0.85
    },
    "specimenLength": 320,
    "lengthBeforeTest": 150,
    "appliedLoad": 85,
    "carbonCrucibleWeight": {
      "value": 11.7784,
      "min": 11.776,
      "max": 11.7808
    },
    "carbonCrucibleWeights": [
      {
        "value": 11.7784,
        "min": 11.776,
        "max": 11.7808
      },
      {
        "value": 12.593,
        "min": 12.591,
        "max": 12.595
      },
      {
        "value": 11.354,
        "min": 11.352,
        "max": 11.356
      },
      {
        "value": 10.8573,
        "min": 10.3556,
        "max": 11.359
      }
    ],
    "carbonSampleWeight": {
      "value": 1.00055,
      "min": 1.0001,
      "max": 1.001
    },
    "carbonPercentage": {
      "value": 2.4000000000000004,
      "min": 2.2,
      "max": 2.6
    },
    "insideDiameter": {
      "value": 14.23,
      "min": 14.23,
      "max": 14.35
    },
    "wallThickness": {
      "value": 0.5,
      "min": 0.5,
      "max": 0.6
    },
    "declaredDischargePerPressure": [
      {
        "pressure": 0.5,
        "discharge": 1.51,
        "min": 1.36,
        "max": 1.66,
        "r3Min": 136,
        "r3Max": 140,
        "r12Min": 146,
        "r12Max": 150,
        "r13Min": 146,
        "r13Max": 152,
        "r23Min": 158,
        "r23Max": 166
      },
      {
        "pressure": 1,
        "discharge": 2,
        "min": 1.8,
        "max": 2.2,
        "r3Min": 180,
        "r3Max": 189,
        "r12Min": 198,
        "r12Max": 205,
        "r13Min": 198,
        "r13Max": 205,
        "r23Min": 210,
        "r23Max": 220
      },
      {
        "pressure": 1.5,
        "discharge": 2.51,
        "min": 2.26,
        "max": 2.76,
        "r3Min": 227,
        "r3Max": 237,
        "r12Min": 248,
        "r12Max": 253,
        "r13Min": 248,
        "r13Max": 253,
        "r23Min": 261,
        "r23Max": 276
      },
      {
        "pressure": 1.8,
        "discharge": 2.75,
        "min": 2.48,
        "max": 3.03,
        "r3Min": 248,
        "r3Max": 258,
        "r12Min": 270,
        "r12Max": 275,
        "r13Min": 270,
        "r13Max": 275,
        "r23Min": 289,
        "r23Max": 303
      }
    ],
    "spacings": [
      {
        "id": "3b6a803a-8a9d-43b8-86be-067a3f6ca9af",
        "value": 30,
        "min": 28.5,
        "max": 31.5
      },
      {
        "id": "fa2e54b5-c12a-46ad-9d25-41f7c8242794",
        "value": 40,
        "min": 38,
        "max": 42
      },
      {
        "id": "9b2310eb-85db-4f2b-b9c4-055b1c6a8056",
        "value": 50,
        "min": 47.5,
        "max": 52.5
      },
      {
        "id": "e601a1c2-883b-48af-88c6-a6bc24745d43",
        "value": 60,
        "min": 57,
        "max": 63
      }
    ]
  },
  {
    "id": "ce1058fc-f417-4f79-90b0-23a307f98521",
    "name": "16 mm, Class - 1, 3.40 LPH",
    "size": "16 mm",
    "className": "1",
    "category": "B, Unregulated",
    "discharge": 3.4,
    "minFlowPath": {
      "value": 0.8,
      "min": 0.8,
      "max": 1
    },
    "specimenLength": 320,
    "lengthBeforeTest": 150,
    "appliedLoad": 85,
    "carbonCrucibleWeight": {
      "value": 11.7784,
      "min": 11.776,
      "max": 11.7808
    },
    "carbonCrucibleWeights": [
      {
        "value": 11.7784,
        "min": 11.776,
        "max": 11.7808
      },
      {
        "value": 12.593,
        "min": 12.591,
        "max": 12.595
      },
      {
        "value": 11.354,
        "min": 11.352,
        "max": 11.356
      },
      {
        "value": 10.8573,
        "min": 10.3556,
        "max": 11.359
      }
    ],
    "carbonSampleWeight": {
      "value": 1.00055,
      "min": 1.0001,
      "max": 1.001
    },
    "carbonPercentage": {
      "value": 2.4000000000000004,
      "min": 2.2,
      "max": 2.6
    },
    "insideDiameter": {
      "value": 14.23,
      "min": 14.23,
      "max": 14.35
    },
    "wallThickness": {
      "value": 0.5,
      "min": 0.5,
      "max": 0.6
    },
    "declaredDischargePerPressure": [
      {
        "pressure": 0.5,
        "discharge": 2.4,
        "min": 2.16,
        "max": 2.64,
        "r3Min": 216,
        "r3Max": 226,
        "r12Min": 235,
        "r12Max": 240,
        "r13Min": 235,
        "r13Max": 240,
        "r23Min": 251,
        "r23Max": 264
      },
      {
        "pressure": 1,
        "discharge": 3.4,
        "min": 3.06,
        "max": 3.74,
        "r3Min": 306,
        "r3Max": 320,
        "r12Min": 333,
        "r12Max": 338,
        "r13Min": 333,
        "r13Max": 338,
        "r23Min": 355,
        "r23Max": 370
      },
      {
        "pressure": 1.5,
        "discharge": 4,
        "min": 3.6,
        "max": 4.4,
        "r3Min": 366,
        "r3Max": 378,
        "r12Min": 391,
        "r12Max": 395,
        "r13Min": 393,
        "r13Max": 398,
        "r23Min": 412,
        "r23Max": 433
      },
      {
        "pressure": 1.8,
        "discharge": 4.45,
        "min": 4.01,
        "max": 4.9,
        "r3Min": 405,
        "r3Max": 420,
        "r12Min": 429,
        "r12Max": 435,
        "r13Min": 429,
        "r13Max": 435,
        "r23Min": 455,
        "r23Max": 475
      }
    ],
    "spacings": [
      {
        "id": "05eba2db-48cc-4c50-ba0d-33ae9a3eedaf",
        "value": 30,
        "min": 28.5,
        "max": 31.5
      },
      {
        "id": "c87e132b-a9e0-407b-9683-5ef8223c738f",
        "value": 40,
        "min": 38,
        "max": 42
      },
      {
        "id": "932dee1c-5878-4180-a715-669d52b49a5c",
        "value": 50,
        "min": 47.5,
        "max": 52.5
      },
      {
        "id": "04515b2f-cb57-4b79-94e1-62c357fa414a",
        "value": 60,
        "min": 57,
        "max": 63
      }
    ]
  }
];

export const defaultSpecs: StandardSpec[] = [
  {
    "id": "ad06b3e2-fa92-4bf5-bb14-647934b690af",
    "size": "16 mm",
    "className": "2",
    "discharge": "1.20 LPH",
    "insideDiameterMin": 14.2,
    "insideDiameterMax": 14.4,
    "wallThicknessMin": 0.7,
    "wallThicknessMax": 0.9,
    "flowPathMin": 0.6,
    "notes": ""
  },
  {
    "id": "753f1548-56a4-4d74-b749-981b66b048aa",
    "size": "16 mm",
    "className": "2",
    "discharge": "2.00 LPH",
    "insideDiameterMin": 14.2,
    "insideDiameterMax": 14.4,
    "wallThicknessMin": 0.7,
    "wallThicknessMax": 0.9,
    "flowPathMin": 0.8,
    "notes": ""
  },
  {
    "id": "9649c2df-3f4b-46d4-869d-b02faf0d4f14",
    "size": "16 mm",
    "className": "2",
    "discharge": "3.00 LPH",
    "insideDiameterMin": 14.2,
    "insideDiameterMax": 14.4,
    "wallThicknessMin": 0.7,
    "wallThicknessMax": 0.9,
    "flowPathMin": 0.8,
    "notes": ""
  },
  {
    "id": "d91a6cdd-2ef6-4100-acd0-b2b9babe0de9",
    "size": "16 mm",
    "className": "2",
    "discharge": "3.40 LPH",
    "insideDiameterMin": 14.2,
    "insideDiameterMax": 14.4,
    "wallThicknessMin": 0.7,
    "wallThicknessMax": 0.9,
    "flowPathMin": 0.8,
    "notes": ""
  },
  {
    "id": "26f5686e-a501-4736-b18d-6110d7a7f378",
    "size": "16 mm",
    "className": "2",
    "discharge": "3.80 LPH",
    "insideDiameterMin": 14.2,
    "insideDiameterMax": 14.4,
    "wallThicknessMin": 0.7,
    "wallThicknessMax": 0.9,
    "flowPathMin": 1,
    "notes": ""
  },
  {
    "id": "4c76d258-eaed-4ff2-9d34-58007c4b0e94",
    "size": "20 mm",
    "className": "1",
    "discharge": "1.20 LPH",
    "insideDiameterMin": 18,
    "insideDiameterMax": 18.2,
    "wallThicknessMin": 0.7,
    "wallThicknessMax": 0.8,
    "flowPathMin": 0.6,
    "notes": ""
  },
  {
    "id": "00ca7f6d-d461-4ae2-a1de-c8f26b3fa420",
    "size": "20 mm",
    "className": "1",
    "discharge": "2.00 LPH",
    "insideDiameterMin": 18,
    "insideDiameterMax": 18.2,
    "wallThicknessMin": 0.7,
    "wallThicknessMax": 0.8,
    "flowPathMin": 0.6,
    "notes": ""
  },
  {
    "id": "d443d2af-72b2-4c6b-a870-6983445040ed",
    "size": "20 mm",
    "className": "1",
    "discharge": "3.00 LPH",
    "insideDiameterMin": 18,
    "insideDiameterMax": 18.2,
    "wallThicknessMin": 0.7,
    "wallThicknessMax": 0.8,
    "flowPathMin": 0.8,
    "notes": ""
  },
  {
    "id": "0357c829-2027-4ca0-83cf-4eda79cc3545",
    "size": "20 mm",
    "className": "1",
    "discharge": "3.40 LPH",
    "insideDiameterMin": 18,
    "insideDiameterMax": 18.2,
    "wallThicknessMin": 0.7,
    "wallThicknessMax": 0.8,
    "flowPathMin": 0.8,
    "notes": ""
  },
  {
    "id": "675bc2da-07cb-46a6-a864-1082243cf397",
    "size": "20 mm",
    "className": "1",
    "discharge": "4.00 LPH",
    "insideDiameterMin": 18,
    "insideDiameterMax": 18.2,
    "wallThicknessMin": 0.7,
    "wallThicknessMax": 0.8,
    "flowPathMin": 0.8,
    "notes": ""
  },
  {
    "id": "50c42a09-0b58-42ae-b7dc-e5e4f74ae4a6",
    "size": "12 mm",
    "className": "2",
    "discharge": "1.20 LPH",
    "insideDiameterMin": 10.5,
    "insideDiameterMax": 10.7,
    "wallThicknessMin": 0.6,
    "wallThicknessMax": 0.7,
    "flowPathMin": 0.6,
    "notes": ""
  },
  {
    "id": "c81bb5f7-e36a-4d9f-87a2-6b6f95b731d7",
    "size": "12 mm",
    "className": "2",
    "discharge": "2.00 LPH",
    "insideDiameterMin": 10.5,
    "insideDiameterMax": 10.7,
    "wallThicknessMin": 0.6,
    "wallThicknessMax": 0.7,
    "flowPathMin": 0.8,
    "notes": ""
  },
  {
    "id": "60f8c1d2-ff3c-4069-bb20-f0630b9ef00a",
    "size": "12 mm",
    "className": "2",
    "discharge": "3.00 LPH",
    "insideDiameterMin": 10.5,
    "insideDiameterMax": 10.7,
    "wallThicknessMin": 0.6,
    "wallThicknessMax": 0.7,
    "flowPathMin": 0.8,
    "notes": ""
  },
  {
    "id": "2a287c90-7736-4ac2-9452-cec8454b8d00",
    "size": "12 mm",
    "className": "2",
    "discharge": "3.40 LPH",
    "insideDiameterMin": 10.5,
    "insideDiameterMax": 10.7,
    "wallThicknessMin": 0.6,
    "wallThicknessMax": 0.7,
    "flowPathMin": 0.8,
    "notes": ""
  },
  {
    "id": "f2bb3f7c-c855-4cbc-a3b3-b12c6e65dad5",
    "size": "12 mm",
    "className": "2",
    "discharge": "3.80 LPH",
    "insideDiameterMin": 10.5,
    "insideDiameterMax": 10.7,
    "wallThicknessMin": 0.6,
    "wallThicknessMax": 0.7,
    "flowPathMin": 0.8,
    "notes": ""
  },
  {
    "id": "22607980-44ae-4f2b-9e72-42b11a17c204",
    "size": "16 mm",
    "className": "1",
    "discharge": "2.00 LPH",
    "insideDiameterMin": 14.2,
    "insideDiameterMax": 14.4,
    "wallThicknessMin": 0.5,
    "wallThicknessMax": 0.6,
    "flowPathMin": 0.7,
    "notes": ""
  },
  {
    "id": "46d03280-0200-48c9-a06e-1189d8367e26",
    "size": "16 mm",
    "className": "1",
    "discharge": "3.80 LPH",
    "insideDiameterMin": 14.2,
    "insideDiameterMax": 14.4,
    "wallThicknessMin": 0.5,
    "wallThicknessMax": 0.6,
    "flowPathMin": 0.8,
    "notes": ""
  }
];
