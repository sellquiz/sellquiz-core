/******************************************************************************
 * SELL - SIMPLE E-LEARNING LANGUAGE                                          *
 *                                                                            *
 * Copyright (c) 2019-2021 TH Köln                                            *
 * Author: Andreas Schwenk, contact@compiler-construction.com                 *
 *                                                                            *
 * Partly funded by: Digitale Hochschule NRW                                  *
 * https://www.dh.nrw/kooperationen/hm4mint.nrw-31                            *
 *                                                                            *
 * GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007                         *
 *                                                                            *
 * This library is licensed as described in LICENSE, which you should have    *
 * received as part of this distribution.                                     *
 *                                                                            *
 * This software is distributed on "AS IS" basis, WITHOUT WARRENTY OF ANY     *
 * KIND, either impressed or implied.                                         *
 ******************************************************************************/

// this file implements math functions that are NOT provided by math.js

import * as math from 'mathjs';

import { sellassert } from './../misc/sellassert';

export class SellLinAlg {
  static mat_idx(m: number, n: number, i: number, j: number) {
    return i * n + j;
  }

  static mat_get_row_count(mathjs_matrix: math.Matrix) {
    return mathjs_matrix.size()[0];
  }

  static mat_get_col_count(mathjs_matrix: math.Matrix) {
    return mathjs_matrix.size()[1];
  }

  static mat_get_element_value(
    mathjs_matrix: math.Matrix,
    i: number,
    j: number,
  ): number {
    return mathjs_matrix.subset(math.index(i, j)) as any as number;
  }

  static mat_submatrix(
    mathjs_matrix: math.Matrix,
    first_row: number,
    last_row: number,
    first_col: number,
    last_col: number,
  ) {
    const m = mathjs_matrix.size()[0];
    const n = mathjs_matrix.size()[1];
    if (last_row == -1)
      // -1 := last row
      last_row = m - 1;
    if (last_col == -1)
      // -1 := last col
      last_col = n - 1;
    if (first_row > last_row || first_col > last_col) return null;
    if (first_row < 0 || first_col < 0 || first_row >= m || first_col >= n)
      return null;
    if (last_row < 0 || last_col < 0 || last_row >= m || last_col >= n)
      return null;
    const resM = last_row - first_row + 1;
    const resN = last_col - first_col + 1;
    let res = math.zeros(resM, resN);
    for (let i = first_row; i <= last_row; i++) {
      for (let j = first_col; j <= last_col; j++) {
        const v = mathjs_matrix.subset(math.index(i, j)) as any as number;
        res = this.mat_set_element(
          res as math.Matrix,
          i - first_row,
          j - first_col,
          v,
        );
      }
    }
    return res;
  }

  static mat_rank(mathjs_matrix: math.Matrix) {
    // implementation based on https://cp-algorithms.com/linear_algebra/rank-matrix.html
    const epsilon = 1e-12;
    const m = mathjs_matrix.size()[0];
    const n = mathjs_matrix.size()[1];
    const v: Array<number> = [];
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++)
        v.push(mathjs_matrix.subset(math.index(i, j)) as any as number);
    let rank = 0;
    const row_selected: Array<boolean> = [];
    for (let k = 0; k < n; k++) row_selected.push(false);
    for (let i = 0; i < m; i++) {
      let j;
      for (j = 0; j < n; j++) {
        if (
          !row_selected[j] &&
          Math.abs(v[this.mat_idx(m, n, i, j)]) > epsilon
        ) {
          break;
        }
      }
      if (j != n) {
        rank++;
        row_selected[j] = true;
        for (let p = i + 1; p < m; p++)
          v[this.mat_idx(m, n, p, j)] /= v[this.mat_idx(m, n, i, j)];
        for (let k = 0; k < n; k++) {
          if (k != j && Math.abs(v[this.mat_idx(m, n, i, k)]) > epsilon) {
            for (let p = i + 1; p < m; p++) {
              v[this.mat_idx(m, n, p, k)] -=
                v[this.mat_idx(m, n, p, j)] * v[this.mat_idx(m, n, i, k)];
            }
          }
        }
      }
    }
    return rank;
  }

  static mat_is_symmetric(mathjs_matrix: math.Matrix) {
    const m = mathjs_matrix.size()[0];
    const n = mathjs_matrix.size()[1];
    if (m != n) return false;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = mathjs_matrix.subset(math.index(i, j)) as any as number;
        const b = mathjs_matrix.subset(math.index(j, i)) as any as number;
        if (math.abs(a - b) > 1e-14) return false;
      }
    }
    return true;
  }

  static mat_triu(mathjs_matrix: math.Matrix) {
    const m = mathjs_matrix.size()[0];
    const n = mathjs_matrix.size()[1];
    let res = math.zeros(m, n);
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        let v = mathjs_matrix.subset(math.index(i, j)) as any as number;
        if (j < i) v = 0;
        res = (res as math.Matrix).subset(math.index(i, j), v);
      }
    }
    return res;
  }

  static mat_norm2(mathjs_matrix: math.Matrix) {
    const m = mathjs_matrix.size()[0];
    const n = mathjs_matrix.size()[1];
    let res = 0.0;
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        const e_ij = (mathjs_matrix as math.Matrix).subset(
          math.index(i, j),
        ) as any;
        res += e_ij * e_ij;
      }
    }
    return math.sqrt(res);
  }

  static mat_vecdot(
    mathjs_matrix_1: math.Matrix,
    mathjs_matrix_2: math.Matrix,
  ) {
    const m1 = mathjs_matrix_1.size()[0];
    const n1 = mathjs_matrix_1.size()[1];
    const m2 = mathjs_matrix_2.size()[0];
    const n2 = mathjs_matrix_2.size()[1];
    if (n1 != 1 || n2 != 1 || m1 != m2)
      sellassert(false, 'mat_vecdot(..): invalid input');
    let res = 0.0;
    for (let i = 0; i < m1; i++) {
      res += ((mathjs_matrix_1.subset(math.index(i, 0)) as any as number) *
        (mathjs_matrix_2.subset(math.index(i, 0)) as any)) as number;
    }
    return res;
  }

  static mat_veccross(
    mathjs_matrix_1: math.Matrix,
    mathjs_matrix_2: math.Matrix,
  ): math.Matrix {
    const m1 = mathjs_matrix_1.size()[0];
    const n1 = mathjs_matrix_1.size()[1];
    const m2 = mathjs_matrix_2.size()[0];
    const n2 = mathjs_matrix_2.size()[1];
    if (n1 != 1 || n2 != 1 || m1 != 3 || m2 != 3)
      sellassert(false, 'mat_veccross(..): invalid input');
    const u1 = this.mat_get_element_value(mathjs_matrix_1, 0, 0);
    const u2 = this.mat_get_element_value(mathjs_matrix_1, 1, 0);
    const u3 = this.mat_get_element_value(mathjs_matrix_1, 2, 0);
    const v1 = this.mat_get_element_value(mathjs_matrix_2, 0, 0);
    const v2 = this.mat_get_element_value(mathjs_matrix_2, 1, 0);
    const v3 = this.mat_get_element_value(mathjs_matrix_2, 2, 0);
    let res = math.zeros(3, 1);
    res = (res as math.Matrix).subset(math.index(0, 0), u2 * v3 - u3 * v2);
    res = (res as math.Matrix).subset(math.index(1, 0), u3 * v1 - u1 * v3);
    res = (res as math.Matrix).subset(math.index(2, 0), u1 * v2 - u2 * v1);
    return res;
  }

  static mat_is_row_zero(
    mat_v: Array<number>,
    m: number,
    n: number,
    i: number,
  ): boolean {
    const epsilon = 1e-12;
    for (let j = 0; j < n; j++) {
      if (Math.abs(mat_v[this.mat_idx(m, n, i, j)]) > epsilon) return false;
    }
    return true;
  }

  static mat_is_zero(mathjs_matrix: math.Matrix): boolean {
    const EPSILON = 1e-12;
    const m = mathjs_matrix.size()[0];
    const n = mathjs_matrix.size()[1];
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        const v = mathjs_matrix.subset(math.index(i, j)) as any as number;
        if (Math.abs(v) > EPSILON) return false;
      }
    }
    return true;
  }

  static linsolve(mathjs_matrix_A: math.Matrix, mathjs_vector_b: math.Matrix) {
    const m = mathjs_matrix_A.size()[0];
    const n = mathjs_matrix_A.size()[1];
    return math.lusolve(mathjs_matrix_A.clone(), mathjs_vector_b.clone());
  }

  static mat_kernel(mathjs_matrix: math.Matrix) {
    // TODO: better use SVD; but yet no suitable implementation in JavaScript found!
    //mathjs_matrix = math.matrix([[2, 1, -1],[0, 2, 3]]); // TODO: remove test!!!!!

    //mathjs_matrix = math.matrix([[1, 2, 3],[0, 4, 5],[0, 0, 6]]); // TODO: remove test!!!!!

    const lup = math.lup(mathjs_matrix) as any;
    const u = lup['U'];
    const m = u.size()[0];
    const n = u.size()[1];
    const v: Array<number> = [];
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++)
        v.push((u as math.Matrix).subset(math.index(i, j)) as any as number);
    // get number of nonzero rows
    let nz;
    for (nz = 0; nz < m; nz++) {
      if (this.mat_is_row_zero(v, m, n, nz)) break;
    }
    //alert(v)
    //alert(nz)
    // set upper-right to zero
    for (let j = nz - 1; j >= 1; j--) {
      for (let i = j - 1; i >= 0; i--) {
        //alert(i + ' ' + j)
        const f = v[this.mat_idx(m, n, i, j)] / v[this.mat_idx(m, n, j, j)];
        //alert(f)
        for (let k = 0; k < n; k++) {
          v[this.mat_idx(m, n, i, k)] -= f * v[this.mat_idx(m, n, j, k)];
        }
      }
    }

    //alert(v)

    // normalize := divide by pivot elements
    for (let i = 0; i < nz; i++) {
      const p = v[this.mat_idx(m, n, i, i)];
      for (let j = 0; j < n; j++) {
        v[this.mat_idx(m, n, i, j)] /= p;
      }
    }

    //alert(v)

    // resulting matrix: ker-vector per column
    const dest_m = n;
    const dest_n = n - nz;
    const dest = [];
    for (let k = 0; k < dest_m * dest_n; k++) dest.push(0.0);
    for (let k = 0; k < dest_n; k++)
      dest[this.mat_idx(dest_m, dest_n, dest_m - 1 - k, dest_n - 1 - k)] = -1; // "-1 - trick"
    for (let i = 0; i < nz; i++) {
      for (let j = 0; j < dest_n; j++) {
        dest[this.mat_idx(dest_m, dest_n, i, j)] =
          v[this.mat_idx(m, n, i, j + nz)];
      }
    }

    let dest_mathjs = math.zeros(dest_m, dest_n);
    for (let i = 0; i < dest_m; i++) {
      for (let j = 0; j < dest_n; j++) {
        dest_mathjs = (dest_mathjs as math.Matrix).subset(
          math.index(i, j),
          dest[this.mat_idx(dest_m, dest_n, i, j)],
        );
      }
    }

    return dest;
  }

  static mat_set_element(
    mathjs_matrix: math.Matrix,
    i: number,
    j: number,
    value: number,
  ) {
    const m = mathjs_matrix.size()[0];
    const n = mathjs_matrix.size()[1];
    if (i < 0 || i >= m) return null;
    if (j < 0 || j >= n) return null;
    mathjs_matrix = mathjs_matrix.subset(math.index(i, j), value);
    return mathjs_matrix;
  }

  static mat_mod(mathjs_matrix: math.Matrix, op2: any) {
    const m = mathjs_matrix.size()[0];
    const n = mathjs_matrix.size()[1];
    let dest = math.zeros(m, n);
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        let v = Math.round(
          mathjs_matrix.subset(math.index(i, j)) as any as number,
        );
        v = math.mod(v, op2);
        dest = (dest as math.Matrix).subset(math.index(i, j), v);
      }
    }
    return dest;
  }

  static mat_compare_numerically(
    mathjs_matrix_a: math.Matrix,
    mathjs_matrix_b: math.Matrix,
  ) {
    const EPSILON = 1e-12;
    const m_a = mathjs_matrix_a.size()[0];
    const n_a = mathjs_matrix_a.size()[1];
    const m_b = mathjs_matrix_b.size()[0];
    const n_b = mathjs_matrix_b.size()[1];
    if (m_a != m_b && n_a != n_b) return false;
    for (let i = 0; i < m_a; i++) {
      for (let j = 0; j < n_a; j++) {
        const va = mathjs_matrix_a.subset(math.index(i, j)) as any as number;
        const vb = mathjs_matrix_b.subset(math.index(i, j)) as any as number;
        if (Math.abs(va - vb) > EPSILON) return false;
      }
    }
    return true;
  }

  static mat_compare_numerically_except_scaling_factor(
    mathjs_matrix_a: math.Matrix,
    mathjs_matrix_b: math.Matrix,
  ) {
    const EPSILON = 1e-12;
    const m_a = mathjs_matrix_a.size()[0];
    const n_a = mathjs_matrix_a.size()[1];
    const m_b = mathjs_matrix_b.size()[0];
    const n_b = mathjs_matrix_b.size()[1];
    if (m_a != m_b && n_a != n_b) return false;
    let initial_f = true;
    let f = 1.0;
    for (let i = 0; i < m_a; i++) {
      for (let j = 0; j < n_a; j++) {
        const va = mathjs_matrix_a.subset(math.index(i, j)) as any as number;
        const vb = mathjs_matrix_b.subset(math.index(i, j)) as any as number;
        if (Math.abs(va * f - vb) > EPSILON) {
          if (initial_f) {
            initial_f = false;
            if (Math.abs(va) < EPSILON || Math.abs(vb) < EPSILON) return false;
            f = vb / va;
          } else {
            return false;
          }
        }
      }
    }
    return true;
  }
} // end of class SellLinAlg
