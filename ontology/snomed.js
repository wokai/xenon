'use strict';
/*******************************************************************************
 * The MIT License
 * Copyright 2023, Wolfgang Kaisers
 * Permission is hereby granted, free of charge, to any person obtaining a 
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included 
 * in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 ******************************************************************************/

const snomed = {
    id: 138875005,
    name: 'SNOMED CT Concept'
    parent: null,
    children: [
      {
        id: 71388002,
        name: 'Procedure',
        parent: 138875005,
        children: [
          {
            id: 362958002,
            name: 'Procedure by site',
            parent: 138875005,
            children: [
              {
                id: 118664000,
                name: ' Procedure on body system',
                parent: 362958002,
                children: [
                  {
                    id: 118669005,
                    name: 'Procedure on respiratory system',
                    parent: 118664000,
                    children: [
                      {
                        id: 53950000,
                        name: 'Respiratory therapy',
                        parent: 118669005,
                        children: []
                      },
                      {
                        id: 1222606000,
                        name: 'Continuous mandatory ventilation',
                        parent: 118669005,
                        children: [
                          {
                            id: 1187023008,
                            name: 'Continuous mandatory ventilation pressure-control inflation-type'
                            parent: 1222606000,
                            children: []
                          },
                          {
                            id: 1186749003,
                            name: 'Continuous mandatory ventilation volume-control inflation-type',
                            parent: 1222606000,
                            children: []
                          }
                        ]
                      },
                      {
                        id: 1197612007,
                        name: 'Intermittent mandatory ventilation',
                        parent: 118669005,
                        children: [
                          {
                            id: 59427005,
                            name: 'Synchronized intermittent mandatory ventilation',
                            parent: 1197612007,
                            children [
                              {
                                id: 1186622005,
                                name: 'Synchronized intermittent mandatory ventilation - pressure-control pressure-support inflation',
                                parent: 59427005,
                                children []
                              },
                              {
                                id: 1186621003,
                                name: 'Synchronized intermittent mandatory ventilation - volume control pressure-support inflation',
                                parent: 59427005,
                                children: []
                              }
                            ]
                          }
                        ]
                      },
                      {
                        id: 1149092001,
                        name: 'Positive pressure ventilation',
                        parent: 118669005,
                        children: [
                          {
                            id: 428311008,
                            name: 'Non-invasive ventilation',
                            parent: 1149092001,
                            children: [
                              {
                                id: 447837008,
                                name: 'Non-invasive positive pressure ventilation',
                                parent: 428311008,
                                children: []
                              }
                            ]
                          },
                          {
                            id: 1197611000,
                            name: 'Positive pressure ventilation via endotracheal tube',
                            parent: 1149092001
                            children: []
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
};

module.exports = Object.freeze(snomed);
